"use client";

import Sidebar from "@components/base_components/Sidebar";
import Header from "@components/base_components/Header";
import Guests from "@components/base_components/Guests";
import styles from "./page.module.css";
import { useSidebar } from "@components/base_components/SidebarContext";
import { useSessionContext } from "@contexts/SessionContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import NavigationProgress from "@components/base_components/NavigationProcess";

export default function Home() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const { role, loading: sessionLoading } = useSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !role) {
      router.push("/login");
    }
  }, [role, sessionLoading, router]);

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  return (
    <>
      <NavigationProgress />
      <div className={styles.pageContainer}>
        <Sidebar role={role || ""} />
        <div
          className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}
        >
          <Header title="Guests" />
          <main className={styles.mainContent}>
            <Guests />
          </main>
        </div>
      </div>
    </>
  );
}
