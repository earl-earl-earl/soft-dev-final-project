"use client";

import Sidebar from "@components/base_components/Sidebar";
import Header from "@components/base_components/Header";
import Rooms from "@components/base_components/Rooms";
import styles from "./page.module.css";
import { useSidebar } from "@components/base_components/SidebarContext";
import { useSession } from "@components/hooks/useSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import NavigationProgress from "@components/base_components/NavigationProcess";

export default function Home() {
  const { isCollapsed: isSidebarCollapsed } = useSidebar();
  const { userRole, loading: sessionLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!sessionLoading && !userRole) {
      router.push("/login");
    }
  }, [userRole, sessionLoading, router]);

  const contentWrapperMarginClass = isSidebarCollapsed
    ? styles.contentWrapperCollapsed
    : styles.contentWrapperExpanded;

  return (
    <>
      <NavigationProgress />
      <div className={styles.pageContainer}>
        <Sidebar role={userRole ?? ""} />
        <div
          className={`${styles.contentWrapper} ${contentWrapperMarginClass}`}
        >
          <Header title="Rooms" />
          <main className={styles.mainContent}>
            <Rooms />
          </main>
        </div>
      </div>
    </>
  );
}
