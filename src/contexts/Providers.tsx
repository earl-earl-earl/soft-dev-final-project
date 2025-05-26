"use client";

import { SidebarProvider } from "@components/base_components/SidebarContext";
import { CacheProvider } from "@/contexts/CacheContext";
import { AuthProvider } from "@/contexts/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CacheProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </CacheProvider>
    </AuthProvider>
  );
}