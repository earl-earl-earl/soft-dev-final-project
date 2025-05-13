"use client";

import Sidebar from "@components/base_components/Sidebar";
import Header from "@components/base_components/Header";
import styles from "./page.module.css";
import Reservations from "@components/base_components/Reservations";
import { useSidebar } from "@components/base_components/SidebarContext";

export default function Home() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar(); 

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  return (
    <div className={styles.pageContainer}>
      <Sidebar /> 
      <div className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}>
        <Header title="Reservations" />
        <main className={styles.mainContent}>
          <Reservations />
        </main>
      </div>
    </div>
  );
}