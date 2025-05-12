"use client";

import Sidebar from "@components/Sidebar";
import Header from "@components/Header";
import styles from "./page.module.css";    // Your existing page-specific styles
// import Reservations from "@components/Reservations"; // Remove or comment out if replacing
import { useSidebar } from "@components/SidebarContext"; // Ensure this path is correct
import StaffFeature from "@components/StaffFeature"; // Import the new component

export default function StaffPage() { // Renamed from Home for clarity
  const { isCollapsed: isSidebarCollapsed } = useSidebar();

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  return (
    <div className={styles.pageContainer}>
      <Sidebar />
      <div className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}>
        <Header title="Staff" /> {/* Updated title */}
        <main className={styles.mainContent}>
          {/* <Reservations /> */} {/* If you were replacing Reservations */}
          <StaffFeature /> {/* Add the StaffFeature component here */}
        </main>
      </div>
    </div>
  );
}