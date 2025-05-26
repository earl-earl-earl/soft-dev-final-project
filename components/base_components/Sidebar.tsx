
import { useEffect, useState } from "react";
import styles from "../component_styles/Sidebar.module.css";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useSidebar } from "./SidebarContext";
import LogoutOverlay from "../overlay_components/LogoutOverlay";
import { useSessionContext } from "@/contexts/SessionContext";

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
  const baseItems: NavItem[] = [
    { type: "link", href: "/dashboard", iconClass: "fa-regular fa-house", activeIconClass: "fa-solid fa-house", text: "Dashboard" },
    { type: "desc", text: "DAILY OPERATIONS" },
    { type: "link", href: "/reservations", iconClass: "fa-regular fa-calendar", activeIconClass: "fa-solid fa-calendar", text: "Reservations" },
    { type: "link", href: "/rooms", iconClass: "fa-regular fa-door-open", activeIconClass: "fa-solid fa-door-open", text: "Rooms" },
  ];

  if (role === 'super_admin' || role === 'admin') {
    baseItems.push(
      { type: "link", href: "/staff", iconClass: "fa-regular fa-user-tie", activeIconClass: "fa-solid fa-user-tie", text: "Staff" },
      { type: "link", href: "/admins", iconClass: "fa-regular fa-user-gear", activeIconClass: "fa-solid fa-user-gear", text: "Admins" }
    );
  } else if (role === 'staff') {
    baseItems.push({
      type: "link", href: "/staff", iconClass: "fa-regular fa-user-tie", activeIconClass: "fa-solid fa-user-tie", text: "Staff"
    });
  }

  return baseItems;
};

const otherNavItemsData = (handleLogoutCallback: () => void): NavItem[] => [
  { type: "link", href: "/settings", iconClass: "fa-regular fa-gear", activeIconClass: "fa-solid fa-gear", text: "Settings" },
  { type: "action", action: handleLogoutCallback, iconClass: "fa-regular fa-right-from-bracket", activeIconClass: "fa-solid fa-right-from-bracket", text: "Logout" },
];

interface SidebarProps {
  role: string;
}

const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const currentPathname = usePathname();
  const [optimisticActiveHref, setOptimisticActiveHref] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { staffName, position } = useSessionContext();

  useEffect(() => {
    if (optimisticActiveHref) setOptimisticActiveHref(null);
  }, [currentPathname, optimisticActiveHref]);

  const handleLogout = () => setShowLogoutModal(true);
  // const handleConfirmLogout = () => window.location.href = "/login";
  const handleCloseLogoutModal = () => setShowLogoutModal(false);

  const currentOtherNavItems = otherNavItemsData(handleLogout);
  const mainNavItems = getMainNavItems(role);

  const renderNavItems = (items: NavItem[]) => {
    return items.map((item, index) => {
      if (item.type === "desc") {
        return !isCollapsed && (
          <p key={`desc-${item.text}-${index}`} className={styles.navDesc}>
            {item.text}
          </p>
        );
      }

      const navItem = item as NavLinkItem;
      const isActive = navItem.type === "link" && navItem.href
        ? optimisticActiveHref === navItem.href || currentPathname.startsWith(navItem.href)
        : false;

      const iconClass = isActive && navItem.activeIconClass
        ? navItem.activeIconClass
        : navItem.iconClass;

      return (
        <div
          key={`${navItem.type}-${navItem.text}-${index}`}
          className={`${styles.navButton} ${isActive ? styles.active : ""} ${navItem.text === "Logout" ? styles.logoutButtonDistinct : ""}`}
          onClick={() => {
            if (navItem.type === "link" && navItem.href) {
              setOptimisticActiveHref(navItem.href);
            }
          }}
        >
          {navItem.type === "link" && navItem.href ? (
            <Link href={navItem.href} className={`${styles.navLink} ${isCollapsed ? styles.navLinkCollapsed : ''}`}>
              <span className={styles.navIconWrapper}><i className={iconClass}></i></span>
              {!isCollapsed && <span className={styles.navLinkText}>{navItem.text}</span>}
              {isCollapsed && <span className={styles.tooltipText}>{navItem.text}</span>}
            </Link>
          ) : navItem.type === "action" && navItem.action ? (
            <>
              <button
                onClick={navItem.action}
                className={`${styles.navLink} ${styles.navButtonAction} ${isCollapsed ? styles.navLinkCollapsed : ''}`}
                title={navItem.text}
              >
                <span className={styles.navIconWrapper}><i className={iconClass}></i></span>
                {!isCollapsed && <span className={styles.navLinkText}>{navItem.text}</span>}
              </button>
              {isCollapsed && <span className={styles.tooltipText}>{navItem.text}</span>}
            </>
          ) : null}
        </div>
      );
    });
  };

  return (
    <>
      <div className={`${styles.container} ${isCollapsed ? styles.collapsedContainer : ""}`}>
        <div className={styles.content}>
          <div className={`${styles.profile} ${isCollapsed ? styles.profileCollapsed : ''}`}>
            <span className={styles.profilePic}>
              {staffName ? staffName.charAt(0).toUpperCase() : "?"}
            </span>
            {!isCollapsed && (
              <div className={styles.profileName}>
                <h2>{staffName ?? "Staff"}</h2>
                <p>{role}</p>
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
              <i className={`fa-regular ${isCollapsed ? "fa-angles-right" : "fa-angles-left"}`}></i>
            </span>
            {!isCollapsed && (
              <span className={styles.toggleButtonText}>Collapse</span>
            )}
          </button>
        </div>
      </div>

      <LogoutOverlay
        isOpen={showLogoutModal}
        onClose={handleCloseLogoutModal}
        // onConfirm={handleConfirmLogout}
      />
    </>
  );
};

export default Sidebar;
