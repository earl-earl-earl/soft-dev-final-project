"use client";

import Sidebar from "@components/base_components/Sidebar";
import Header from "@components/base_components/Header";
import Dashboard from "@components/base_components/Dashboard";
import styles from "./page.module.css";
import { useSidebar } from "@components/base_components/SidebarContext";
import { useSessionContext } from "@/contexts/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const { role: userRole, loading: sessionLoading } = useSessionContext();
  const router = useRouter();

  // Redirect if not authenticated or role is missing
  useEffect(() => {
    if (!sessionLoading && !userRole) {
      router.push("/login");
    }
  }, [sessionLoading, userRole, router]);

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  if (sessionLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!userRole) return null;

  return (
    <div className={styles.pageContainer}>
      <Sidebar role={userRole} />
      <div className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}>
        <Header title="Dashboard" />
        <main className={styles.mainContent}>
          <Dashboard />
        </main>
      </div>
    </div>
  );
}
