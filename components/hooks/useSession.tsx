// hooks/useSession.ts
"use client";

import { useSession as useNextAuthSession } from "next-auth/react";
import { Session } from "next-auth";

// Extend the Session type to include role property
interface CustomSession extends Session {
  user: {
    id?: string | undefined;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | undefined;
  };
}

export function useSession() {
  const { data: session, status } = useNextAuthSession();
  const loading = status === "loading";
  const userRole = (session as CustomSession)?.user?.role || null;
  
  return { userRole, loading };
}
