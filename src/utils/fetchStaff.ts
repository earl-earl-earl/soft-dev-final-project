// src/utils/fetchStaff.ts
import { supabase } from '@/lib/supabaseClient';
import { StaffMember } from '../types/staff';

export interface StaffLookup {
  [key: string]: StaffMember; // Key will be staff member's ID (string UUID)
}

export interface FetchStaffResult {
  staff: StaffMember[];
  staffLookup: StaffLookup; 
  error?: string;
}

export const fetchStaff = async (): Promise<FetchStaffResult> => {
  // console.log("fetchStaff: Attempting to fetch /api/staff");
  try {
    const response = await fetch('/api/staff'); 
    
    if (!response.ok) {
      let errorJson;
      try {
        errorJson = await response.json();
      } catch (e) {
      }
      const errorMessage = errorJson?.error || `HTTP error! Status: ${response.status} ${response.statusText}`;
      console.error("fetchStaff: API request failed:", errorMessage);
      throw new Error(errorMessage);
    }

    const staffData: StaffMember[] = await response.json();
    // console.log("fetchStaff: Successfully fetched and parsed staffData count:", staffData?.length);
    
    const staffLookup: StaffLookup = {};
    (staffData || []).forEach(s => {
      if (s && s.id) {
        staffLookup[s.id] = s;
      }
    });

    return { staff: staffData || [], staffLookup };
  } catch (error: any) {
    console.error("fetchStaff: Caught utility error:", error);
    return { staff: [], staffLookup: {}, error: error.message || "Unknown error fetching staff." };
  }
};

let staffSubscriptionChannel: any = null;

export const subscribeToStaffChanges = (
  onStaffChange: (result: FetchStaffResult) => void
): { unsubscribe: () => void } => {
  const channelName = `staff-and-users-public-changes`;
  
  if (!supabase) {
    console.error("fetchStaff - subscribeToStaffChanges: Supabase client is not initialized. Realtime disabled.");
    return { unsubscribe: () => {} };
  }

  const cleanupOldChannel = () => {
    if (staffSubscriptionChannel && typeof staffSubscriptionChannel.unsubscribe === 'function') {
      // console.log(`fetchStaff: Removing existing channel subscription for ${channelName}`);
      supabase.removeChannel(staffSubscriptionChannel)
        .then(() => { /* console.log(`Channel ${channelName} removed.`); */ })
        .catch(err => console.error(`Error removing channel ${channelName}:`, err));
      staffSubscriptionChannel = null;
    }
  };
  
  cleanupOldChannel();
  
  const handleSubscriptionUpdate = async () => {
    // console.log("fetchStaff: Realtime change detected, refetching staff list via API...");
    fetchStaff().then(onStaffChange);
  };
  
  staffSubscriptionChannel = supabase.channel(channelName);
  staffSubscriptionChannel
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'staff' }, 
      (payload: any) => {
        // console.log("Realtime: 'staff' table change detected.", payload);
        handleSubscriptionUpdate();
      }
    )
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'users' }, 
      (payload: any) => {
        const oldRole = payload.old?.role; 
        const newRole = payload.new?.role;
        // Define relevant roles based on your application's user types for staff/admins
        const relevantRolesForStaffList = ['staff', 'admin'];

        // Check if the change involves a relevant role for the staff list
        if ( (newRole && relevantRolesForStaffList.includes(newRole.toLowerCase())) || 
             (oldRole && relevantRolesForStaffList.includes(oldRole.toLowerCase())) ||
             (payload.eventType === 'INSERT' && newRole && relevantRolesForStaffList.includes(newRole.toLowerCase())) ||
             (payload.eventType === 'DELETE' && oldRole && relevantRolesForStaffList.includes(oldRole.toLowerCase()))
           ) {
          // console.log("Realtime: 'users' table change relevant to staff/admin list detected.", payload);
          handleSubscriptionUpdate();
        }
      }
    )
    // .subscribe((status: string, err?: Error) => {
    //   if (status === 'SUBSCRIBED') { 
    //     // console.log(`Realtime: Successfully subscribed to ${channelName}`); 
    //   } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
    //     console.error(`Realtime: Subscription on ${channelName} issue: ${status}`, err);
    //   }
    //   // You might want to handle 'SUBSCRIPTION_ERROR' as well
    // });
  
  handleSubscriptionUpdate();
  
  return { 
    unsubscribe: () => { 
      if (staffSubscriptionChannel && typeof staffSubscriptionChannel.unsubscribe === 'function') {
        // console.log(`Realtime: Unsubscribing from ${channelName}`);
        staffSubscriptionChannel.unsubscribe()
          .then(() => { /* console.log(`Channel ${channelName} unsubscribed.`); */ })
          .catch((err: any) => console.error(`Error unsubscribing from ${channelName}:`, err));
        staffSubscriptionChannel = null;
      }
    }
  };
};