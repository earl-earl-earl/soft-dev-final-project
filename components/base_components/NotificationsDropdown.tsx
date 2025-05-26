"use client";

import { useState, useEffect, useRef } from 'react';
import styles from '../component_styles/NotificationsDropdown.module.css';

// Types for our notifications
interface Notification {
  id: string;
  type: 'reservation' | 'check-out' | 'new-booking' | 'cancelled' | 'payment';  // Changed check-in to reservation
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  icon: string;
  source?: 'online' | 'direct';
}

interface NotificationsDropdownProps {
  notifications: Notification[];
  onlyOnlineReservations?: boolean;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ 
  notifications, 
  onlyOnlineReservations = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Filter notifications for online reservations
  const filteredNotifications = onlyOnlineReservations 
    ? notifications.filter(notification => 
        (notification.type === 'new-booking' || notification.type === 'reservation') && 
        (notification.source === 'online' || notification.description.toLowerCase().includes('online')))
    : notifications;
    
  const unreadCount = filteredNotifications.filter(notif => !notif.isRead).length;

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.notificationsContainer} ref={dropdownRef}>
      <div className={styles.iconTooltipWrapper}>
        <button 
          className={styles.notificationButton} 
          onClick={toggleDropdown} 
          title="Online Reservations"
        >
          <i className={`fa-regular fa-bell ${styles.icon}`}></i>
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </button>
        <span className={styles.tooltipText}>Online Reservations</span>
      </div>
      
      {isOpen && (
        <div className={styles.notificationsDropdown}>
          <div className={styles.notificationsHeader}>
            <h3>Online Reservations</h3>
          </div>
          
          <div className={styles.notificationsBody}>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                >
                  <div className={styles.notificationIcon}>
                    <i className={notification.icon}></i>
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>{notification.title}</div>
                    <div className={styles.notificationDescription}>{notification.description}</div>
                    <div className={styles.notificationTime}>{notification.timestamp}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noNotifications}>
                <i className="fa-regular fa-bell-slash"></i>
                <p>No online reservations</p>
              </div>
            )}
          </div>
          
          <div className={styles.notificationsFooter}>
            <button className={styles.loadMoreButton}>Load More</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;