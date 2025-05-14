"use client";

import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@components/base_components/SidebarContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </SessionProvider>
  );
}