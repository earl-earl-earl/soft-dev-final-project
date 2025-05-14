"use client";

import Sidebar from "@components/base_components/Sidebar";
import Header from "@components/base_components/Header";
import Guests from "@components/base_components/Guests";
import styles from "./page.module.css";
import { useSidebar } from "@components/base_components/SidebarContext";
import { useSession } from "@components/hooks/useSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const { userRole, loading: sessionLoading } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (!sessionLoading && !userRole) {
      router.push('/login');
    }
  }, [userRole, sessionLoading, router]);

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

  if (!userRole) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar role={userRole} /> 
      <div className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}>
        <Header title="Guests" />
        <main className={styles.mainContent}>
          <Guests />
        </main>
      </div>
    </div>
  );
}