// src/utils/fetchAdmins.ts
import { supabase } from '@/lib/supabaseClient';
import { AdminMember } from '../types/admin';

export interface AdminLookup {
  [key: string]: AdminMember;
}

export interface FetchAdminsResult {
  admins: AdminMember[];
  adminLookup: AdminLookup;
  error?: string;
}

// Main fetch function - now calls your API endpoint
export const fetchAdmins = async (): Promise<FetchAdminsResult> => {
  // console.log("fetchAdmins utility: Attempting to fetch /api/admin");
  try {
    const response = await fetch('/api/admin'); // <<<< CALLS YOUR GET /api/admin ENDPOINT
    
    if (!response.ok) {
      let errorJson;
      try {
        errorJson = await response.json();
      } catch (e) {
        // Response body was not JSON
      }
      const errorMessage = errorJson?.error || `HTTP error! Status: ${response.status} ${response.statusText}`;
      console.error("fetchAdmins utility: API request to /api/admin failed:", errorMessage);
      throw new Error(errorMessage);
    }

    const adminsData: AdminMember[] = await response.json();
    // console.log("fetchAdmins utility: Successfully fetched and parsed adminsData count:", adminsData?.length);
    
    const adminLookup: AdminLookup = {};
    (adminsData || []).forEach(admin => { 
      if (admin && admin.id) {
        adminLookup[admin.id] = admin; 
      }
    });

    return { admins: adminsData || [], adminLookup };
  } catch (error: any) {
    console.error("fetchAdmins utility: Caught error:", error);
    return { admins: [], adminLookup: {}, error: error.message || "Unknown error fetching admins." };
  }
};

// Real-time subscription functionality
let adminSubscriptionChannel: any = null;

export const subscribeToAdminChanges = (
  onAdminChange: (result: FetchAdminsResult) => void
): { unsubscribe: () => void } => {
  const channelName = 'admin-user-and-staff-profile-changes';
  
  if (!supabase) {
    console.error("fetchAdmins - subscribeToAdminChanges: Supabase client not initialized.");
    return { unsubscribe: () => {} };
  }

  const existingChannel = supabase.channel(channelName);
  if (existingChannel && typeof (existingChannel as any).unsubscribe === 'function') {
    // console.log(`fetchAdmins: Removing existing channel ${channelName} before re-subscribing.`);
    supabase.removeChannel(existingChannel);
  }
  
  const handleSubscriptionUpdate = async () => {
    // console.log(`fetchAdmins: Realtime change detected for admin-related tables, refetching admins via API...`);
    fetchAdmins().then(onAdminChange); // fetchAdmins now calls GET /api/admin
  };
  
  adminSubscriptionChannel = supabase.channel(channelName);
  adminSubscriptionChannel
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'staff' }, // Changes to staff profiles
      (payload: any) => {
        // To be more efficient, check if payload involves a user_id that *is* an admin
        // For now, refetch if any staff profile changes, as admins have staff profiles.
        // console.log("Realtime: 'staff' table change potentially affecting admins detected.", payload);
        handleSubscriptionUpdate();
      }
    )
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'users' }, 
      (payload: any) => {
        const oldRole = payload.old?.role; 
        const newRole = payload.new?.role;
        const adminRoles = ['admin', 'super_admin']; // Lowercase DB enum values

        // Refetch if a user's role changes to/from an admin role,
        // or if an existing admin user's record is updated/deleted.
        if ( (newRole && adminRoles.includes(newRole.toLowerCase())) || 
             (oldRole && adminRoles.includes(oldRole.toLowerCase())) ||
             (payload.eventType === 'INSERT' && newRole && adminRoles.includes(newRole.toLowerCase())) ||
             (payload.eventType === 'DELETE' && oldRole && adminRoles.includes(oldRole.toLowerCase()))
           ) {
          // console.log("Realtime: 'users' table change relevant to admin list detected.", payload);
          handleSubscriptionUpdate();
        }
      }
    )
    // .subscribe((status: string, err?: Error) => {
    //   if (status === 'SUBSCRIBED') { 
    //     // console.log(`Realtime: Successfully subscribed to ${channelName} for admin changes.`); 
    //   } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
    //     console.error(`Realtime: Subscription on ${channelName} issue: ${status}`, err);
    //   }
    // });
  
  handleSubscriptionUpdate(); // Initial fetch when subscription is set up
  
  return { 
    unsubscribe: () => { 
      if (adminSubscriptionChannel && typeof adminSubscriptionChannel.unsubscribe === 'function') {
        // console.log(`Realtime: Unsubscribing from ${channelName}`);
        adminSubscriptionChannel.unsubscribe()
          .then(() => { /* console.log(`Channel ${channelName} unsubscribed for admin changes.`); */ })
          .catch((error: any) => console.error(`Error unsubscribing from ${channelName}:`, error));
        adminSubscriptionChannel = null;
      }
    }
  };
};