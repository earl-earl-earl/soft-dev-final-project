"use client";

import { useState } from "react";
import Sidebar from "@components/Sidebar";      // Adjust path if needed
import Header from "@components/Header";  // Adjust path if needed
import styles from "./page.module.css";

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  // Determine which class to apply to the content wrapper based on the sidebar's state
  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  return (
    <div className={styles.pageContainer}>
      <Sidebar onToggle={handleSidebarToggle} />
      <div className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}>
        <Header title="Dashboard" /> {/* Pass the desired title for the page */}
        <main className={styles.mainContent}>
          <h2>Main Content Area</h2>
          <p>
            This is the main content area. It sits to the right of the sidebar
            and below the header. The layout should adjust when the sidebar
            collapses or expands.
          </p>
          <ul>
            <li>Test Sidebar: Collapse and expand it.</li>
            <li>Test Sidebar: Hover over icons when collapsed to see tooltips.</li>
            <li>Test Sidebar: Click on navigation items to test the active state.</li>
            <li>Test Header: Click the calendar icon to open the date picker.</li>
          </ul>

          <h3>Sample Section 1</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
            commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
            velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
            occaecat cupidatat non proident, sunt in culpa qui officia deserunt
            mollit anim id est laborum.
          </p>

          <h3>Sample Section 2</h3>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae
            ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt
            explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut
            odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
            voluptatem sequi nesciunt.
          </p>

          {/* Tall div to ensure scrolling within mainContent */}
          <div style={{
            height: "100vh",
            background: "rgba(0,0,0,0.03)",
            border: "1px dashed #ddd",
            marginTop: "30px",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box"
          }}>
            <p style={{fontSize: "1.5em", color: "#bbb"}}>Scrollable Content Extender</p>
          </div>
        </main>
      </div>
    </div>
  );
}