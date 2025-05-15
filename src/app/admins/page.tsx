"use client";

import Sidebar from "@components/base_components/Sidebar";
import Header from "@components/base_components/Header";
import styles from "./page.module.css";
import { useSidebar } from "@components/base_components/SidebarContext";
import { useSession } from "@components/hooks/useSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PageLoadingReset from '@/components/PageLoadingReset';
import AdminFeature from "@components/base_components/AdminFeature";

export default function Home() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const { userRole, loading: sessionLoading } = useSession();
  const router = useRouter();

  // Use NextAuth to check authentication status - no need for duplicate Supabase check
  useEffect(() => {
    if (!sessionLoading && !userRole) {
      router.push('/login');
    }
  }, [userRole, sessionLoading, router]);

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  // Show loading state while checking authentication or fetching user role
  if (sessionLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen in useEffect)
  if (!userRole) {
    return null;
  }

  return (
    <div className={styles.pageContainer}>
      <Sidebar role={userRole} /> 
      <div className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}>
        <Header title="Admins" />
        <main className={styles.mainContent}>
          <PageLoadingReset />
          <AdminFeature />
        </main>
      </div>
    </div>
  );
}