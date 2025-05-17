import { useState, useCallback, useEffect } from 'react';
import { AdminMember, AdminFormData } from '../types/admin';
import { subscribeToAdminChanges } from '../utils/fetchAdmins';
import { supabase } from '../lib/supabaseClient'; // Make sure to import supabase

export function useAdmins() {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Set up real-time subscription when component mounts
  useEffect(() => {
    const subscription = subscribeToAdminChanges((result) => {
      setAdmins(result.admins);
      setIsLoading(false);
      setError(null);
    });
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const addAdmin = useCallback(async (adminData: AdminFormData) => {
    try {
      setIsLoading(true);
      
      // Step 1: First create the base user in the users table
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          email: adminData.email,
          role: adminData.role || 'admin',
          is_active: true
          // Only core user data goes here
        }])
        .select('id')
        .single();
    
      if (userError || !newUser) {
        throw new Error(userError?.message || "Failed to create user record");
      }

      // Step 2: Create the admin profile record
      const { error: adminError } = await supabase
        .from('staff') // Using the same staff table for consistency
        .insert([{
          user_id: newUser.id, // Reference to the user record
          name: adminData.name,
          phone_number: adminData.phoneNumber,
          position: adminData.accessLevel, // Or use adminData.position if available
          username: adminData.email?.split('@')[0] || `admin-${newUser.id}`
          // Other admin-specific fields can go here
        }]);
      
      if (adminError) {
        // Rollback the user creation if staff record creation fails
        await supabase.from('users').delete().eq('id', newUser.id);
        throw new Error(adminError.message);
      }
      
      return { success: true };
    } catch (err) {
      console.error("Error adding admin:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to add admin' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const updateAdmin = useCallback(async (id: string, adminData: Partial<AdminFormData>) => {
    try {
      setIsLoading(true);
      
      // Update the users table instead of admin table
      const { error } = await supabase
        .from('users')  // Change from 'admin' to 'users' to match the fetch operation
        .update({
          // name: adminData.name, - removed this field
          email: adminData.email,  // Make sure column names match database schema
          role: adminData.role,
          // Removed access_level field that was causing issues
        })
        .eq('id', id);
    
      if (error) {
        console.error("Supabase update error:", error);
        throw new Error(error.message || "Unknown database error");
      }
      
      setError(null);
      return { success: true };
    } catch (err) {
      setError('Failed to update admin: ' + (err instanceof Error ? err.message : String(err)));
      console.error(err);
      return { success: false, error: 'Failed to update admin' };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const toggleAdminStatus = useCallback(async (id: string) => {
    try {
      // Find current status
      const admin = admins.find(a => a.id === id);
      if (!admin) {
        throw new Error('Admin not found');
      }
      
      // Use users table, not admin table
      const { error } = await supabase
        .from('users')  // Changed from 'admin' to 'users'
        .update({ is_active: !admin.isActive })
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { success: true };
    } catch (err) {
      console.error("Error toggling admin status:", err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to toggle admin status' 
      };
    }
  }, [admins]);
  
  const refreshAdmins = useCallback(async (options?: { showLoading?: boolean, silentError?: boolean }) => {
    if (options?.showLoading !== false) {
      setIsLoading(true);
    }
    
    try {
      console.log("Manually refreshing admin data...");
      const result = await fetchAdmins();
      setAdmins(result.admins);
      setError(null);
      return { success: true, data: result.admins };
    } catch (err) {
      console.error("Error refreshing admins:", err);
      if (!options?.silentError) {
        setError(err instanceof Error ? err.message : "Failed to refresh admins");
      }
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    } finally {
      if (options?.showLoading !== false) {
        setIsLoading(false);
      }
    }
  }, []);
  
  return {
    admins,
    isLoading,
    error,
    addAdmin,
    updateAdmin,
    toggleAdminStatus,
    refreshAdmins
  };
}
// Define the AdminFetchResult interface
interface AdminFetchResult {
  admins: AdminMember[];
  adminLookup: Record<string, AdminMember>;
}

// Implementation of fetchAdmins function
export const fetchAdmins = async (): Promise<AdminFetchResult> => {
  console.log("Starting to fetch admins...");
  
  try {
    // First, get admin users from users table
    const { data: adminUsers, error: adminError } = await supabase
      .from("users")
      .select('*')
      .in("role", ["admin", "super_admin"]); // Get both admin roles

    console.log("Raw admin users response:", { data: adminUsers?.length || 0, error: adminError });
    
    if (adminError) {
      console.error("Error fetching admin users:", adminError);
      return { admins: [], adminLookup: {} };
    }
    
    if (!adminUsers || adminUsers.length === 0) {
      return { admins: [], adminLookup: {} };
    }

    // Extract user IDs to query staff table
    const userIds = adminUsers.map(user => user.id);
    
    // Now fetch corresponding staff records
    const { data: staffRecords, error: staffError } = await supabase
      .from("staff")
      .select('*')
      .in('user_id', userIds);
      
    console.log("Raw staff records for admins:", { 
      data: staffRecords?.length || 0, 
      error: staffError 
    });
    
    // Create a lookup object for staff records keyed by user_id for quick access
    const staffLookup: Record<string, any> = {};
    if (staffRecords) {
      staffRecords.forEach(record => {
        staffLookup[record.user_id] = record;
      });
    }
    
    // Process the combined data
    const adminLookup: Record<string, AdminMember> = {};
    const admins: AdminMember[] = adminUsers.map(user => {
      // Get the corresponding staff record if exists
      const staffRecord = staffLookup[user.id];
      
      const adminMember: AdminMember = {
        id: user.id,
        // Use staff data if available, otherwise fallback to user data
        name: staffRecord?.name || user.name || 'Unknown Admin',
        email: user.email || '',
        phoneNumber: staffRecord?.phone_number || user.phone_number || '',
        role: user.role || 'admin',
        accessLevel: staffRecord?.position || 'Standard Access',
        isActive: user.is_active !== undefined ? user.is_active : true
      };
      
      // Add to lookup
      adminLookup[adminMember.id] = adminMember;
      
      return adminMember;
    });
    
    return { admins, adminLookup };
  } catch (err) {
    console.error("Exception fetching admins:", err);
    return { admins: [], adminLookup: {} };
  }
};

// This would be in a server-side API route
export async function createAdminUser(adminData) {
  // 1. Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: adminData.email,
    password: adminData.password,
    email_confirm: true // Auto-confirm the email
  });
  
  if (authError) throw authError;
  
  // 2. Set user metadata in users table
  const { error: dbError } = await supabase
    .from('users')
    .insert({
      id: authUser.user, // Use the auth user ID
      email: adminData.email,
      name: adminData.name,
      role: adminData.role,
      is_active: true
    });
    
  if (dbError) throw dbError;
  
  return { success: true };
}