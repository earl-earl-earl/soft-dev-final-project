"use client";

import { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";
import Link from "next/link";
import { usePathname, /* useRouter */ } from 'next/navigation'; // Added useRouter
import { useSidebar } from "./SidebarContext";

interface NavLinkItem {
  type: "link" | "action"; // Added "action" type for buttons like logout
  href?: string; // Optional for action type
  action?: () => void; // Optional for action type
  iconClass: string;
  activeIconClass?: string;
  text: string;
}

interface NavDescItem {
  type: "desc";
  text: string;
}

type NavItem = NavLinkItem | NavDescItem;

// No change to mainNavItemsData
const mainNavItemsData: NavItem[] = [
  { type: "link", href: "/dashboard", iconClass: "fa-regular fa-house", activeIconClass: "fa-solid fa-house", text: "Overview" },
  { type: "desc", text: "DAILY OPERATIONS" },
  { type: "link", href: "/reservations", iconClass: "fa-regular fa-calendar", activeIconClass: "fa-solid fa-calendar", text: "Reservations" },
  { type: "link", href: "/guests", iconClass: "fa-regular fa-users", activeIconClass: "fa-solid fa-users", text: "Guests" },
  { type: "link", href: "/rooms", iconClass: "fa-regular fa-door-open", activeIconClass: "fa-solid fa-door-open", text: "Rooms" },
  { type: "link", href: "/staff", iconClass: "fa-regular fa-user-tie", activeIconClass: "fa-solid fa-user-tie", text: "Staff" },
];

// Modified otherNavItemsData for logout
const otherNavItemsData = (handleLogoutCallback: () => void): NavItem[] => [
  { type: "link", href: "/settings", iconClass: "fa-regular fa-gear", activeIconClass: "fa-solid fa-gear", text: "Settings" },
  { type: "action", action: handleLogoutCallback, iconClass: "fa-regular fa-right-from-bracket", activeIconClass: "fa-solid fa-right-from-bracket", text: "Logout" },
];


// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const currentPathname = usePathname();
  // const router = useRouter(); // Initialize router for potential programmatic navigation
  const [optimisticActiveHref, setOptimisticActiveHref] = useState<string | null>(null);

  useEffect(() => {
    if (optimisticActiveHref) {
      setOptimisticActiveHref(null);
    }
  }, [currentPathname, optimisticActiveHref]);

  const handleLogout = () => {
    console.log("Logout action triggered");
    // Add your actual logout logic here, e.g.:
    // await signOut(); // if using NextAuth or similar
    // router.push('/login'); // Redirect to login page
    alert("Logout functionality to be implemented!"); // Placeholder
  };

  const currentOtherNavItems = otherNavItemsData(handleLogout);


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

      const navActionItem = item as NavLinkItem; // Can be a link or action
      const isLogoutButton = navActionItem.text === "Logout" && navActionItem.type === "action";

      let isActive = false;
      if (navActionItem.type === "link" && navActionItem.href) { // isActive only for links
        const pathMatches = navActionItem.href === "/" ?
                              currentPathname === navActionItem.href :
                              currentPathname.startsWith(navActionItem.href);

        if (optimisticActiveHref) {
          isActive = navActionItem.href === optimisticActiveHref;
        } else {
          isActive = pathMatches;
        }
      }

      const currentIconClass = isActive && navActionItem.activeIconClass
                               ? navActionItem.activeIconClass
                               : navActionItem.iconClass;

      return (
        <div
          key={`${navActionItem.type}-${navActionItem.text}-${index}`}
          className={`${styles.navButton} ${isActive ? styles.active : ""} ${isLogoutButton ? styles.logoutButtonDistinct : ""}`}
          onClick={() => {
            if (navActionItem.type === "link" && navActionItem.href) {
              setOptimisticActiveHref(navActionItem.href);
            }
          }}
        >
          {navActionItem.type === "link" && navActionItem.href ? (
            <Link href={navActionItem.href} className={`${styles.navLink} ${isCollapsed ? styles.navLinkCollapsed : ''}`}>
              <span className={styles.navIconWrapper}>
                <i className={currentIconClass}></i>
              </span>
              {!isCollapsed && <span className={styles.navLinkText}>{navActionItem.text}</span>}
              {isCollapsed && <span className={styles.tooltipText}>{navActionItem.text}</span>}
            </Link>
          ) : navActionItem.type === "action" && navActionItem.action ? (
            <> {/* Fragment to return button and tooltip as siblings */}
              <button
                onClick={navActionItem.action}
                className={`${styles.navLink} ${styles.navButtonAction} ${isCollapsed ? styles.navLinkCollapsed : ''}`}
                title={navActionItem.text} // Good for accessibility
              >
                <span className={styles.navIconWrapper}>
                  <i className={currentIconClass}></i>
                </span>
                {!isCollapsed && <span className={styles.navLinkText}>{navActionItem.text}</span>}
                {/* Tooltip span is no longer a direct child of the button when collapsed */}
              </button>
              {/* Tooltip is now a sibling to the button, still child of div.navButton */}
              {isCollapsed && <span className={styles.tooltipText}>{navActionItem.text}</span>}
            </>
          ) : null}
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
          {renderNavItems(currentOtherNavItems)} {/* Use the generated items with callback */}
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