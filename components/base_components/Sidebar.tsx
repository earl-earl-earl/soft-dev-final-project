"use client";

import { useEffect, useState } from "react";
import styles from "../component_styles/Sidebar.module.css";
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from "./SidebarContext";
import LogoutOverlay from "../overlay_components/LogoutOverlay";

interface NavLinkItem {
  type: "link" | "action";
  href?: string;
  action?: () => void;
  iconClass: string;
  activeIconClass?: string;
  text: string;
}

interface NavDescItem {
  type: "desc";
  text: string;
}

type NavItem = NavLinkItem | NavDescItem;

const getMainNavItems = (role: string): NavItem[] => {

  // Base navigation items that everyone can see
  const baseItems: NavItem[] = [
    { type: "link", href: "/dashboard", iconClass: "fa-regular fa-house", activeIconClass: "fa-solid fa-house", text: "Dashboard" },
    { type: "desc", text: "DAILY OPERATIONS" },
    { type: "link", href: "/reservations", iconClass: "fa-regular fa-calendar", activeIconClass: "fa-solid fa-calendar", text: "Reservations" },
    // { type: "link", href: "/guests", iconClass: "fa-regular fa-users", activeIconClass: "fa-solid fa-users", text: "Guests" },
    { type: "link", href: "/rooms", iconClass: "fa-regular fa-door-open", activeIconClass: "fa-solid fa-door-open", text: "Rooms" },
  ];
  
  // Role-specific items
  if (role === 'super_admin' || role === 'admin') {
    // Super admin sees both staff and admins
    baseItems.push(
      { type: "link", href: "/staff", iconClass: "fa-regular fa-user-tie", activeIconClass: "fa-solid fa-user-tie", text: "Staff" },
      { type: "link", href: "/admins", iconClass: "fa-regular fa-user-gear", activeIconClass: "fa-solid fa-user-gear", text: "Admins" }
    );
  } else if (role === 'staff') {
    // staff sees only staff
    baseItems.push(
      { type: "link", href: "/staff", iconClass: "fa-regular fa-user-tie", activeIconClass: "fa-solid fa-user-tie", text: "Staff" }
    );
  }

  return baseItems;
};

const otherNavItemsData = (handleLogoutCallback: () => void): NavItem[] => [
  { type: "link", href: "/settings", iconClass: "fa-regular fa-gear", activeIconClass: "fa-solid fa-gear", text: "Settings" },
  { type: "action", action: handleLogoutCallback, iconClass: "fa-regular fa-right-from-bracket", activeIconClass: "fa-solid fa-right-from-bracket", text: "Logout" },
];


// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarProps {
  role: string; // Add role prop

}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const currentPathname = usePathname();
  const router = useRouter();
  const [optimisticActiveHref, setOptimisticActiveHref] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (optimisticActiveHref) {
      setOptimisticActiveHref(null);
    }
  }, [currentPathname, optimisticActiveHref]);

  const handleLogout = () => {
    // Show the logout confirmation modal instead of an alert
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    // Actual logout functionality to implement
    console.log("Logout confirmed");
    // Show loading state during logout
    
    // Add actual logout code here:
    // await signOut(); // if using NextAuth
    router.push('/login'); // Use Next.js router for client-side navigation
    // The loading will be handled by the navigation
  };

  const handleCloseLogoutModal = () => {
    setShowLogoutModal(false);
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

      const navActionItem = item as NavLinkItem;
      const isLogoutButton = navActionItem.text === "Logout" && navActionItem.type === "action";

      let isActive = false;
      if (navActionItem.type === "link" && navActionItem.href) {
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
            <>
              <button
                onClick={navActionItem.action}
                className={`${styles.navLink} ${styles.navButtonAction} ${isCollapsed ? styles.navLinkCollapsed : ''}`}
                title={navActionItem.text}
              >
                <span className={styles.navIconWrapper}>
                  <i className={currentIconClass}></i>
                </span>
                {!isCollapsed && <span className={styles.navLinkText}>{navActionItem.text}</span>}
              </button>
              {isCollapsed && <span className={styles.tooltipText}>{navActionItem.text}</span>}
            </>
          ) : null}
        </div>
      );
    });
  };

  const mainNavItems = getMainNavItems(role);

  return (
    <>
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
            {renderNavItems(mainNavItems)}
          </div>
        </div>

        <div className={styles.bottomContent}>
          <div className={styles.navBar}>
            {!isCollapsed && <p className={styles.navDesc}>OTHER</p>}
            {renderNavItems(currentOtherNavItems)}
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

      {/* Add the LogoutOverlay component */}
      <LogoutOverlay 
        isOpen={showLogoutModal}
        onClose={handleCloseLogoutModal}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};

export default Sidebar;