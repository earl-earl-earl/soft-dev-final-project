"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"; // Added ReactNode
import { supabase } from "@/lib/supabaseClient";
import { User, Session } from "@supabase/supabase-js"; // Added Session
import { useRouter } from "next/navigation"; // For App Router

interface SessionContextType {
  user: User | null;
  userId: string | null;
  role: string | null;       // From your 'users' table
  staffName: string | null;  // From your 'staff' table
  staffUsername: string | null; // Corrected: staffUsername from your state // <<<< Typo correction from staffuserName
  position: string | null;   // From your 'staff' table
  loading: boolean;
  // Optional: if you need to expose the raw Supabase session object
  // session: Session | null; 
}

// Provide default values that match the type
const defaultSessionContextValue: SessionContextType = {
  user: null,
  userId: null,
  role: null,
  staffName: null,
  staffUsername: null, // Corrected
  position: null,
  loading: true,
};

const SessionContext = createContext<SessionContextType>(defaultSessionContextValue);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [staffUsername, setStaffUsername] = useState<string | null>(null); // Corrected variable name
  const [position, setPosition] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const resetState = () => {
    setUser(null);
    setUserId(null);
    setRole(null);
    setStaffName(null);
    setStaffUsername(null);
    setPosition(null);
    setLoading(false); // Finished processing the logout/invalidation
  };

  // Renamed to avoid conflict with Supabase session object if you decide to store it
  const fetchAppSessionData = async (currentAuthUser: User | null) => {
    if (!currentAuthUser) {
      console.log("fetchAppSessionData: No authenticated user, resetting state.");
      resetState();
      return;
    }

    // Only set user and userId if not already set by onAuthStateChange directly
    // This function is now more about fetching profile data for an existing auth user.
    if (!user || user.id !== currentAuthUser.id) setUser(currentAuthUser);
    if (!userId || userId !== currentAuthUser.id) setUserId(currentAuthUser.id);

    // console.log("fetchAppSessionData: Fetching profile data for user:", currentAuthUser.id);
    try {
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("role, is_active") // Check is_active here too
        .eq("id", currentAuthUser.id)
        .single();

      if (userError || !userRow) {
        console.warn("fetchAppSessionData: Failed to fetch 'users' table details or user not found:", userError?.message);
        await supabase.auth.signOut(); // If profile is missing, something is wrong, sign out
        resetState(); // This will trigger redirect via onAuthStateChange
        return;
      }

      // If user is marked inactive in our custom table, force sign out
      if (!userRow.is_active) {
        console.warn(`fetchAppSessionData: User ${currentAuthUser.id} is inactive in 'users' table. Forcing sign out.`);
        await supabase.auth.signOut();
        resetState(); // This will trigger redirect via onAuthStateChange
        return;
      }

      setRole(userRow.role);

      // Fetch staff details only if the user is not a 'customer' (or any other role that doesn't have a staff profile)
      // Adjust this condition based on your roles that DO have staff profiles
      if (userRow.role && userRow.role !== "customer") { 
        const { data: staffRow, error: staffError } = await supabase
          .from("staff")
          .select("name, username, position")
          .eq("user_id", currentAuthUser.id)
          .single();

        if (staffError) {
          // It's possible an admin/super_admin doesn't have a staff record if created differently
          // Log as warning, not necessarily a full state reset unless staff profile is mandatory for these roles
          console.warn("fetchAppSessionData: Failed to fetch 'staff' info (this might be okay for some roles):", staffError.message);
          setStaffName(currentAuthUser.user_metadata?.full_name || null); // Fallback to metadata if available
          setStaffUsername(currentAuthUser.user_metadata?.display_username || null);
          setPosition(null); // Or a default position/access level
        } else if (staffRow) {
          setStaffName(staffRow.name ?? null);
          setStaffUsername(staffRow.username ?? null);
          setPosition(staffRow.position ?? null);
        } else {
            // No staff record found, might be an issue or by design for some roles
            console.warn(`fetchAppSessionData: No staff record found for user ${currentAuthUser.id} with role ${userRow.role}`);
            setStaffName(currentAuthUser.user_metadata?.full_name || null);
            setStaffUsername(currentAuthUser.user_metadata?.display_username || null);
            setPosition(null);
        }
      } else {
        // User is a customer or a role without a staff profile
        setStaffName(null);
        setStaffUsername(null);
        setPosition(null);
      }
    } catch (e) {
        console.error("fetchAppSessionData: Exception during profile data fetch", e);
        await supabase.auth.signOut(); // Sign out on unexpected error
        resetState();
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // console.log("SessionContext: Initial getSession response:", session);
      if (session?.user) {
        fetchAppSessionData(session.user);
      } else {
        resetState(); // No initial session, ensure state is clean and loading is false
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("SessionContext: onAuthStateChange - Event:", _event, "Session User ID:", session?.user?.id);
        
        if (_event === 'SIGNED_OUT' || !session?.user) {
          console.log("SessionContext: SIGNED_OUT or no user in session. Resetting state and redirecting to login.");
          resetState();
          if (window.location.pathname !== '/login') { // Avoid redirect loop if already on login
            router.push('/login'); // <<<< REDIRECT TO LOGIN
          }
        } else if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') {
          // If there's a user, fetch their app-specific session data (role, staff profile, is_active check)
          // console.log("SessionContext: SIGNED_IN, TOKEN_REFRESHED, or USER_UPDATED. Fetching app session data.");
          await fetchAppSessionData(session.user);
        }
        // USER_DELETED event also results in session becoming null
      }
    );

    return () => {
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [router]); // router is stable, so this effect runs once on mount

  return (
    <SessionContext.Provider value={{ user, userId, role, staffName, staffUsername, position, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (context === undefined) { // Ensure provider is used
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
};