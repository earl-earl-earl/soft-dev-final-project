"use client";

import { SidebarProvider } from "@components/base_components/SidebarContext";
import { CacheProvider } from "@/contexts/CacheContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </CacheProvider>
  );
}