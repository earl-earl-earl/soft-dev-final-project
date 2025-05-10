"use client";

import { useState } from "react";
import Sidebar from "@components/Sidebar";
import Header from "@components/Header";
import styles from "./page.module.css";
import Reservations from "@components/Reservations";

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  return (
    <div className={styles.pageContainer}>
      <Sidebar onToggle={handleSidebarToggle} />
      <div className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}>
        <Header title="Reservations" />
        <main className={styles.mainContent}>
          <Reservations />
        </main>
      </div>
    </div>
  );
}