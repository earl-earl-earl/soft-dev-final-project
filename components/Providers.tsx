"use client";

import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@components/base_components/SidebarContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import LoadingOverlay from "@components/overlay_components/LoadingOverlay";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SidebarProvider>
        <LoadingProvider>
          <LoadingOverlay />
          {children}
        </LoadingProvider>
      </SidebarProvider>
    </SessionProvider>
  );
}