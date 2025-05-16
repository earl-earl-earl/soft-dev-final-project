"use client";

import Sidebar from "@components/base_components/Sidebar";
import Header from "@components/base_components/Header";
import styles from "./page.module.css";
import { useSidebar } from "@components/base_components/SidebarContext";
import StaffFeature from "@components/base_components/StaffFeature";
import { useSessionContext } from "@contexts/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import NavigationProgress from "@components/base_components/NavigationProcess";

export default function Home() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const { role, loading: sessionLoading } = useSessionContext();
  const router = useRouter();

  // Use NextAuth to check authentication status - no need for duplicate Supabase check
  useEffect(() => {
    if (!sessionLoading && !role) {
      router.push("/login");
    }
  }, [role, sessionLoading, router]);

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  // Show loading state while checking authentication or fetching user role

  return (
    <>
      <NavigationProgress />
      <div className={styles.pageContainer}>
        <Sidebar role={role || ""} />
        <div
          className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}
        >
          <Header title="Staff" />
          <main className={styles.mainContent}>
            <StaffFeature />
          </main>
        </div>
      </div>
    </>
  );
}
