"use client";

import Sidebar from "@components/base_components/Sidebar";
import Header from "@components/base_components/Header";
import Dashboard from "@components/base_components/Dashboard";
import styles from "./page.module.css";
import { useSidebar } from "@components/base_components/SidebarContext";
import { useSession } from "@components/hooks/useSession";
import NavigationProgress from "@components/base_components/NavigationProcess"; // Adjust the path as necessary

export default function Home() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const { userRole } = useSession();


  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  return (
    <>
      <NavigationProgress />
      <div className={styles.pageContainer}>
        <Sidebar role={userRole || 'guest'} />
        <div
          className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}
        >
          <Header title="Dashboard" />
          <main className={styles.mainContent}>
            <Dashboard />
          </main>
        </div>
      </div>
    </>
  );
}
