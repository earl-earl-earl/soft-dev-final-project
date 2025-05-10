"use client";

import { useState, useEffect } from "react";
import styles from "./Sidebar.module.css";
import Link from "next/link";

interface NavLinkItem {
  type: "link";
  href: string;
  iconClass: string;
  text: string;
  active?: boolean;
}

interface NavDescItem {
  type: "desc";
  text: string;
}

type NavItem = NavLinkItem | NavDescItem;

const mainNavItemsData: NavItem[] = [
  { type: "link", href: "/dashboard", iconClass: "fa-solid fa-house", text: "Overview", active: true },
  { type: "desc", text: "DAILY OPERATIONS" },
  { type: "link", href: "/reservations", iconClass: "fa-regular fa-calendar", text: "Reservations" },
  { type: "link", href: "/guests", iconClass: "fa-regular fa-users", text: "Guests" },
  { type: "link", href: "/rooms", iconClass: "fa-regular fa-door-open", text: "Rooms" },
  { type: "link", href: "/staff", iconClass: "fa-regular fa-user-tie", text: "Staff" },
];

const otherNavItemsData: NavItem[] = [
  { type: "link", href: "/settings", iconClass: "fa-regular fa-gear", text: "Settings" },
  { type: "link", href: "/logout", iconClass: "fa-regular fa-right-from-bracket", text: "Logout" },
];

interface SidebarProps {
  onToggle?: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItemHref, setActiveItemHref] = useState<string | null>(null);

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onToggle) {
      onToggle(newCollapsedState);
    }
  };

  useEffect(() => {
    const allNavLinks = [...mainNavItemsData, ...otherNavItemsData].filter(
      (item): item is NavLinkItem => item.type === 'link'
    );
    const initiallyActiveItem = allNavLinks.find(item => item.active);
    if (initiallyActiveItem) {
      setActiveItemHref(initiallyActiveItem.href);
    } else if (allNavLinks.length > 0) {
      // setActiveItemHref(allNavLinks[0].href);
    }
  }, []);


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
     
      const isActive = item.type === 'link' && activeItemHref === item.href;

      return (
        <div
          key={`${item.type}-${item.text}-${index}`}
          className={`${styles.navButton} ${isActive ? styles.active : ""}`}
          onClick={() => {
            if (item.type === 'link') {
              setActiveItemHref(item.href);
            }
          }}
        >
          <Link href={item.href} className={`${styles.navLink} ${isCollapsed ? styles.navLinkCollapsed : ''}`}>
            <span className={styles.navIconWrapper}>
              <i className={item.iconClass}></i>
            </span>
            {!isCollapsed && <span className={styles.navLinkText}>{item.text}</span>}
            {isCollapsed && <span className={styles.tooltipText}>{item.text}</span>}
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