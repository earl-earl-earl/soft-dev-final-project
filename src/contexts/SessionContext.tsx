"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

interface SessionContextType {
  user: User | null;
  userId: string | null;
  role: string | null;
  staffName: string | null;
  position: string | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  userId: null,
  role: null,
  staffName: null,
  position: null,
  loading: true,
});

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [staffName, setStaffName] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const resetState = () => {
    setUser(null);
    setUserId(null);
    setRole(null);
    setStaffName(null);
    setPosition(null);
    setLoading(false);
  };

  const fetchSessionData = async () => {
    setLoading(true);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const authUser = sessionData?.session?.user;

    if (!authUser || sessionError) {
      console.warn("No authenticated user or session error:", sessionError?.message);
      resetState();
      return;
    }

    setUser(authUser);
    setUserId(authUser.id);

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single();

    if (userError || !userRow) {
      console.warn("Failed to fetch role:", userError?.message);
      resetState();
      return;
    }

    const userRole = userRow.role;
    setRole(userRole);

    if (userRole !== "customer") {
      const { data: staffRow, error: staffError } = await supabase
        .from("staff")
        .select("name, position")
        .eq("user_id", authUser.id)
        .single();

      if (staffError) {
        console.warn("Failed to fetch staff info:", staffError.message);
      }

      setStaffName(staffRow?.name ?? null);
      setPosition(staffRow?.position ?? null);
    } else {
      setStaffName(null);
      setPosition(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSessionData();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        console.log("Logged out: clearing session state.");
        resetState();
      } else {
        console.log("Logged in or session changed: refreshing session data.");
        fetchSessionData();
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ user, userId, role, staffName, position, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => useContext(SessionContext);
