import { supabase } from "@/lib/supabaseClient";
import { StaffMember } from "../types/staff";

export interface StaffLookup {
  [key: string]: StaffMember;
}

export interface FetchStaffResult {
  staff: StaffMember[];
  staffLookup: StaffLookup;
}

// Main fetch function
export const fetchStaff = async (): Promise<FetchStaffResult> => {
  console.log("Starting to fetch staff...");
  
  try {
    // First, get users with "staff" role
    const { data: staffUsers, error: userError } = await supabase
      .from("users")
      .select('*')
      .eq("role", "staff");
    
    if (userError) {
      console.error("Error fetching staff users:", userError.message);
      return { staff: [], staffLookup: {} };
    }
    
    if (!staffUsers || staffUsers.length === 0) {
      console.log("No staff users found");
      return { staff: [], staffLookup: {} };
    }
    
    // Get user IDs to fetch corresponding staff records
    const userIds = staffUsers.map(user => user.id);
    
    // Now fetch corresponding staff details
    const { data: staffData, error: staffError } = await supabase
      .from("staff")
      .select('*')
      .in('user_id', userIds);
      
    if (staffError) {
      console.error("Error fetching staff details:", staffError.message);
      return { staff: [], staffLookup: {} };
    }
    
    if (!staffData || staffData.length === 0) {
      console.log("No staff details found");
      return { staff: [], staffLookup: {} };
    }
    
    // Create a lookup object for staff records keyed by user_id for quick access
    const usersLookup: Record<string, any> = {};
    staffUsers.forEach(user => {
      usersLookup[user.id] = user;
    });
    
    // Create lookup table
    const staffLookup: StaffLookup = {};
    
    // Transform staff data to our application format
    const staff: StaffMember[] = staffData.map(member => {
      const user = usersLookup[member.user_id];
      
      const staffMember: StaffMember = {
        id: member.user_id,
        username: member.username || user?.email?.split('@')[0] || `user-${member.user_id}`,
        name: member.name || 'Unknown Name',
        phoneNumber: member.phone_number || '',
        role: user?.role || 'staff',
        position: member.position || 'Staff',
        isActive: member.is_active !== undefined ? member.is_active : true
      };
      
      // Add to lookup
      staffLookup[staffMember.id] = staffMember;
      
      return staffMember;
    });
    
    console.log("Processed staff:", staff.length);
    
    return {
      staff,
      staffLookup
    };
  } catch (err) {
    console.error("Error in fetchStaff:", err);
    return { staff: [], staffLookup: {} };
  }
};

// Helper function to format date in "Month DD, YYYY" format
const formatDate = (dateInput: string | Date): string => {
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  });
};

// Real-time subscription functionality
let staffSubscription: { unsubscribe: () => void } | null = null;

export const subscribeToStaffChanges = (
  onStaffChange: (result: FetchStaffResult) => void
): { unsubscribe: () => void } => {
  // Unsubscribe from existing subscription if there is one
  if (staffSubscription) {
    staffSubscription.unsubscribe();
  }

  console.log("Setting up real-time subscription to staff...");
  
  // Initial fetch to get current state
  fetchStaff().then(onStaffChange);
  
  // Subscribe to all changes in the staff table
  staffSubscription = supabase
    .channel('staff-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'staff' 
      }, 
      () => {
        console.log("Staff change detected, fetching updated data...");
        fetchStaff().then(onStaffChange);
      }
    )
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users'
      },
      (payload) => {
        // Only refetch if it might affect staff data
        console.log("User change detected, fetching updated staff data...");
        fetchStaff().then(onStaffChange);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      if (staffSubscription) {
        console.log("Unsubscribing from staff changes...");
        staffSubscription.unsubscribe();
        staffSubscription = null;
      }
    }
  };
};