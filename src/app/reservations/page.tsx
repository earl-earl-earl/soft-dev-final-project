"use client";

import Sidebar from "@components/base_components/Sidebar";
import Header from "@components/base_components/Header";
import styles from "./page.module.css";
import Reservations from "@components/base_components/Reservations";
import { useSidebar } from "@components/base_components/SidebarContext";
import { useSessionContext } from "@/contexts/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const { user, role, loading } = useSessionContext(); // Global session context

  const router = useRouter();

  useEffect(() => {
    if (!loading && !role) {
      router.push("/login");
    }
  }, [role, loading, router]);

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Block rendering while unauthenticated
  if (!role) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar role={role} />
      <div className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}>
        <Header title="Reservations" />
        <main className={styles.mainContent}>
          <Reservations />
        </main>
      </div>
    </div>
  );
}
