import { supabase } from "@/lib/supabaseClient";
import { AdminMember } from "../types/admin";

export interface AdminLookup {
  [key: string]: AdminMember;
}

export interface FetchAdminsResult {
  admins: AdminMember[];
  adminLookup: AdminLookup;
}

// Main fetch function
export const fetchAdmins = async (): Promise<FetchAdminsResult> => {
  console.log("Starting to fetch admins...");
  
  // Fetch admin data from users table where role is admin or super_admin
  const { data: adminData, error: adminError } = await supabase
    .from("users")
    .select('*')
    .or('role.eq.admin,role.eq.super_admin');

  console.log("Raw admin response from Supabase:", { data: adminData?.length || 0, error: adminError });
  
  if (adminError) {
    console.error("Error fetching admins:", adminError.message);
    return { admins: [], adminLookup: {} };
  }
  
  if (!adminData || adminData.length === 0) {
    console.log("No admin data returned from the database");
    return { admins: [], adminLookup: {} };
  }

  // Create lookup table
  const adminLookup: AdminLookup = {};
  
  // Transform admin data to our application format
  const admins: AdminMember[] = adminData.map(user => {
    const adminMember: AdminMember = {
      id: user.id,
      username: user.username || user.email?.split('@')[0] || `admin-${user.id}`,
      name: user.name || user.display_name || 'Unknown Admin',
      email: user.email || '',
      phoneNumber: user.phone_number || '',
      role: user.role || 'admin',
      accessLevel: user.access_level || 'Standard Access',
      isActive: user.is_active !== undefined ? user.is_active : true
    };
    
    // Add to lookup
    adminLookup[adminMember.id] = adminMember;
    
    return adminMember;
  });

  console.log("Processed admins:", admins.length);
  
  return {
    admins,
    adminLookup
  };
};

// Real-time subscription functionality
let adminsSubscription: { unsubscribe: () => void } | null = null;

export const subscribeToAdminChanges = (
  onAdminChange: (result: FetchAdminsResult) => void
): { unsubscribe: () => void } => {
  // Unsubscribe from existing subscription if there is one
  if (adminsSubscription) {
    adminsSubscription.unsubscribe();
  }

  console.log("Setting up real-time subscription to admins...");
  
  // Initial fetch to get current state
  fetchAdmins().then(onAdminChange);
  
  // Subscribe to all changes in the users table
  adminsSubscription = supabase
    .channel('admin-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'users' 
      }, 
      (payload) => {
        // Only refetch if it might affect admin data (i.e., the user has an admin role)
        if (
          (payload.new && 'role' in payload.new && 
           (payload.new.role === 'admin' || payload.new.role === 'super_admin')) ||
          (payload.old && 'role' in payload.old && 
           (payload.old.role === 'admin' || payload.old.role === 'super_admin'))
        ) {
          console.log("Admin change detected, fetching updated data...");
          fetchAdmins().then(onAdminChange);
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      if (adminsSubscription) {
        console.log("Unsubscribing from admin changes...");
        adminsSubscription.unsubscribe();
        adminsSubscription = null;
      }
    }
  };
};