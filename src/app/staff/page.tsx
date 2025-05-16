"use client";

import Sidebar from "@components/base_components/Sidebar";
import Header from "@components/base_components/Header";
import styles from "./page.module.css";
import { useSidebar } from "@components/base_components/SidebarContext";
import StaffFeature from "@components/base_components/StaffFeature";
import { useSession } from "@components/hooks/useSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import NavigationProgress from "@components/base_components/NavigationProcess";

export default function StaffPage() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const { userRole, loading: sessionLoading } = useSession();
  const router = useRouter();

  // Use NextAuth to check authentication status
  useEffect(() => {
    if (!sessionLoading && !userRole) {
      router.push("/login");
    }
  }, [userRole, sessionLoading, router]);

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  // Show loading state while checking authentication or fetching user role
  if (sessionLoading) {
    return (
      <>
        <NavigationProgress />
      </>
    );
  }

  // If not authenticated, don't render anything (redirect will happen in useEffect)
  if (!userRole) return null;

  return (
    <>
      <NavigationProgress />
      <div className={styles.pageContainer}>
        <Sidebar role={userRole} />
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
