"use client";

import Sidebar from "@components/Sidebar";
import Header from "@components/Header";
import styles from "./page.module.css";
import { useSidebar } from "@components/SidebarContext";

export default function Home() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  return (
    <div className={styles.pageContainer}>
      <Sidebar /> 
      <div className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}>
        <Header title="Rooms" />
        <main className={styles.mainContent}>
          Nigga
        </main>
      </div>
    </div>
  );
}