"use client";

import Sidebar from "@components/Sidebar";
import Header from "@components/Header";
import styles from "./page.module.css";
import { useSidebar } from "@components/SidebarContext";
import StaffFeature from "@components/StaffFeature";

export default function StaffPage() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <div className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}>
        <Header title="Staff" />
        <main className={styles.mainContent}>
          <StaffFeature />
        </main>
      </div>
    </div>
  );
}