import { supabase } from "@/lib/supabaseClient";
import { AdminMember } from "../types/admin";
import { ROLES } from "@/types/staff";

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
  
  try {
    // First, get admin users from users table
    const { data: adminUsers, error: adminError } = await supabase
      .from("users")
      .select('*')
      .in("role", ["admin", "super_admin"]);

    console.log("Raw admin users response:", { data: adminUsers?.length || 0, error: adminError });
    
    if (adminError) {
      console.error("Error fetching admin users:", adminError);
      return { admins: [], adminLookup: {} };
    }
    
    if (!adminUsers || adminUsers.length === 0) {
      console.log("No admin users found");
      return { admins: [], adminLookup: {} };
    }

    // Extract user IDs to query staff table
    const userIds = adminUsers.map(user => user.id);
    console.log("User IDs for staff lookup:", userIds);
    
    // Now fetch corresponding staff records
    const { data: staffRecords, error: staffError } = await supabase
      .from("staff")
      .select('*')
      .in('user_id', userIds);
      
    console.log("Raw staff records for admins:", { 
      data: staffRecords?.length || 0, 
      error: staffError 
    });
    
    if (staffError) {
      console.error("Error fetching staff records:", staffError);
      // Continue with just user data if staff fetch fails
    }
    
    // Create a lookup object for staff records keyed by user_id for quick access
    const staffLookup: Record<string, any> = {};
    if (staffRecords && staffRecords.length > 0) {
      staffRecords.forEach(record => {
        if (record.user_id) {
          staffLookup[record.user_id] = record;
        }
      });
    }
    
    console.log("Built staff lookup with keys:", Object.keys(staffLookup));
    
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
    
    console.log("Processed admins:", admins.length);
    return { admins, adminLookup };
  } catch (err) {
    console.error("Exception fetching admins:", err);
    return { admins: [], adminLookup: {} };
  }
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
  
  // Subscribe to all changes in the admin table
  adminsSubscription = supabase
    .channel('admin-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'users',  // Add a filter to only get admin updates
      }, 
      () => {
        console.log("Admin user change detected, fetching updated data...");
        fetchAdmins().then(onAdminChange);
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