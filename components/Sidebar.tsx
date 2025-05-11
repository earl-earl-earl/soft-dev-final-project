"use client";

import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useSidebar } from "./SidebarContext";

interface NavLinkItem {
  type: "link";
  href: string;
  iconClass: string;
  activeIconClass?: string;
  text: string;
}

interface NavDescItem {
  type: "desc";
  text: string;
}

type NavItem = NavLinkItem | NavDescItem;

const mainNavItemsData: NavItem[] = [
  { type: "link", href: "/dashboard", iconClass: "fa-regular fa-house", activeIconClass: "fa-solid fa-house", text: "Overview" },
  { type: "desc", text: "DAILY OPERATIONS" },
  { type: "link", href: "/reservations", iconClass: "fa-regular fa-calendar", activeIconClass: "fa-solid fa-calendar", text: "Reservations" },
  { type: "link", href: "/guests", iconClass: "fa-regular fa-users", activeIconClass: "fa-solid fa-users", text: "Guests" },
  { type: "link", href: "/rooms", iconClass: "fa-regular fa-door-open", activeIconClass: "fa-solid fa-door-open", text: "Rooms" },
  { type: "link", href: "/staff", iconClass: "fa-regular fa-user-tie", activeIconClass: "fa-solid fa-user-tie", text: "Staff" },
];

const otherNavItemsData: NavItem[] = [
  { type: "link", href: "/settings", iconClass: "fa-regular fa-gear", activeIconClass: "fa-solid fa-gear", text: "Settings" },
  { type: "link", href: "/logout", iconClass: "fa-regular fa-right-from-bracket", activeIconClass: "fa-solid fa-right-from-bracket", text: "Logout" },
];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const currentPathname = usePathname();
  const [optimisticActiveHref, setOptimisticActiveHref] = useState<string | null>(null);

  useEffect(() => {
    if (optimisticActiveHref) {
      setOptimisticActiveHref(null);
    }
  }, [currentPathname, optimisticActiveHref]);

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item: NavItem, index: number) => {
      if (item.type === "desc") {
        return (
          !isCollapsed && (
            <p key={`desc-${item.text}-${index}`} className={styles.navDesc}>
              {item.text}
            </p>
          )
        );
      }

      const navLinkItem = item as NavLinkItem;

      let isActive = false;
      const pathMatches = navLinkItem.href === "/" ?
                            currentPathname === navLinkItem.href :
                            currentPathname.startsWith(navLinkItem.href);

      if (optimisticActiveHref) {
        isActive = navLinkItem.href === optimisticActiveHref;
      } else {
        isActive = pathMatches;
      }

      const currentIconClass = isActive && navLinkItem.activeIconClass 
                               ? navLinkItem.activeIconClass 
                               : navLinkItem.iconClass;

      return (
        <div
          key={`${navLinkItem.type}-${navLinkItem.text}-${index}`}
          className={`${styles.navButton} ${isActive ? styles.active : ""}`}
          onClick={() => {
            setOptimisticActiveHref(navLinkItem.href);
          }}
        >
          <Link href={navLinkItem.href} className={`${styles.navLink} ${isCollapsed ? styles.navLinkCollapsed : ''}`}>
            <span className={styles.navIconWrapper}>
              <i className={currentIconClass}></i>
            </span>
            {!isCollapsed && <span className={styles.navLinkText}>{navLinkItem.text}</span>}
            {isCollapsed && <span className={styles.tooltipText}>{navLinkItem.text}</span>}
          </Link>
        </div>
      );
    });
  };

  return (
    <div className={`${styles.container} ${isCollapsed ? styles.collapsedContainer : ""}`}>
      <div className={styles.content}>
        <div className={`${styles.profile} ${isCollapsed ? styles.profileCollapsed : ''}`}>
          <span className={styles.profilePic}>A</span>
          {!isCollapsed && (
            <div className={styles.profileName}>
              <h2>Adolf Lifter</h2>
              <p>Admin</p>
            </div>
          )}
        </div>

        <div className={styles.navBar}>
          {renderNavItems(mainNavItemsData)}
        </div>
      </div>

      <div className={styles.bottomContent}>
        <div className={styles.navBar}>
          {!isCollapsed && <p className={styles.navDesc}>OTHER</p>}
          {renderNavItems(otherNavItemsData)}
        </div>

        <button
          onClick={toggleSidebar}
          className={`${styles.toggleButton} ${isCollapsed ? styles.toggleButtonCollapsed : ''}`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span className={styles.navIconWrapper}>
            {isCollapsed ? (
              <i className="fa-regular fa-angles-right"></i>
            ) : (
              <i className="fa-regular fa-angles-left"></i>
            )}
          </span>
          {!isCollapsed && (
            <span className={styles.toggleButtonText}>Collapse</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;