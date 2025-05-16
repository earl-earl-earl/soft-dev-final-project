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
  
  // Fetch staff data
  const { data: staffData, error: staffError } = await supabase
    .from("staff")
    .select('*');

  console.log("Raw staff response from Supabase:", { data: staffData?.length || 0, error: staffError });
  
  if (staffError) {
    console.error("Error fetching staff:", staffError.message);
    return { staff: [], staffLookup: {} };
  }
  
  if (!staffData || staffData.length === 0) {
    console.log("No staff data returned from the database");
    return { staff: [], staffLookup: {} };
  }

  // Create lookup table
  const staffLookup: StaffLookup = {};
  
  // Transform staff data to our application format
  const staff: StaffMember[] = staffData.map(member => {
    const staffMember: StaffMember = {
      id: member.user_id || member.id,
      username: member.username || member.email?.split('@')[0] || `user-${member.id}`,
      name: member.name || 'Unknown Name',
      email: member.email || '',
      phoneNumber: member.phone_number || '',
      role: member.role || 'Staff',
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