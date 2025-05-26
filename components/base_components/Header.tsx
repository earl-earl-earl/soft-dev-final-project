// components/Header/Header.tsx
"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isSameDay } from 'date-fns';

import styles from "../component_styles/Header.module.css";
import { useReservations } from "../../src/hooks/useReservations";
import NotificationsDropdown from "./NotificationsDropdown";

// Define the Notification interface
interface Notification {
  id: string;
  type: "reservation" | "check-out" | "new-booking" | "cancelled" | "payment";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  icon: string;
  source: "online" | "direct" | undefined;
}

// Online reservation notifications only
const onlineReservationNotifications: Notification[] = [
  {
    id: "1",
    type: "reservation",
    title: "New Online Reservation",
    description: "Reservation #A1701 - Lozada, Daven Jerthrude - Room: Resthouse",
    timestamp: "2 hours ago",
    isRead: false,
    icon: "fa-regular fa-calendar-check",
    source: "online"
  },
  {
    id: "2",
    type: "reservation",
    title: "New Online Reservation",
    description: "Reservation #A1189 - Ledesma, Marben Jhon - Room: Ohana - Check-in: May 06, 2025",
    timestamp: "5 hours ago",
    isRead: false,
    icon: "fa-regular fa-calendar-check",
    source: "online"
  },
  {
    id: "3",
    type: "reservation",
    title: "New Online Reservation",
    description: "Reservation #A1702 - Santos, Maria - Room: Villa - Check-in: May 28, 2025",
    timestamp: "Yesterday at 8:42 PM",
    isRead: true,
    icon: "fa-regular fa-calendar-check",
    source: "online"
  },
  {
    id: "4",
    type: "reservation",
    title: "New Online Reservation",
    description: "Reservation #A1698 - Reyes, Antonio - Room: Villa - Check-in: June 12, 2025",
    timestamp: "May 24 at 2:15 PM",
    isRead: false,
    icon: "fa-regular fa-calendar-check",
    source: "online"
  },
  {
    id: "5",
    type: "reservation",
    title: "New Online Reservation",
    description: "Reservation #A1695 - Cruz, Isabella - Room: Camille - Check-in: May 30, 2025",
    timestamp: "May 24 at 10:08 AM",
    isRead: true,
    icon: "fa-regular fa-calendar-check",
    source: "online"
  },
  {
    id: "6",
    type: "reservation",
    title: "New Online Reservation",
    description: "Reservation #A1690 - Mendoza, Rafael - Room: Ohana - Check-in: June 05, 2025",
    timestamp: "May 23 at 7:30 PM",
    isRead: true,
    icon: "fa-regular fa-calendar-check",
    source: "online"
  }
];

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [todayDate] = useState<Date>(new Date()); // Store today's date separately
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Use the hook to get reservation data
  const { reservations } = useReservations();

  const handleDateChange = (date: Date | null) => {
    // Update the selectedDate state for internal use
    setSelectedDate(date);
    setIsCalendarOpen(false);
    
    // Custom logic for when a date is selected
    console.log(`Date selected: ${date?.toDateString()}`);
  };

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  // Always use today's date for display in the button
  const formattedDate = format(todayDate, "E, dd MMM");

  // Function to determine if a date has confirmed arrivals
  const hasArrivals = (date: Date) => {
    // Check if reservations is available
    if (!reservations || reservations.length === 0) {
      return false;
    }

    return reservations.some(reservation => {
      // Check for multiple status types that indicate confirmed bookings
      const confirmedStatuses = ['Accepted', 'Confirmed_Pending_Payment'];
      const isConfirmed = confirmedStatuses.includes(reservation.status);
      return isConfirmed && isSameDay(date, reservation.checkIn);
    });
  };

  // Custom day class function for DatePicker
  const dayClassName = (date: Date) => {
    // First check if it's today to apply the today highlight
    if (isSameDay(date, todayDate)) {
      return hasArrivals(date) ? `${styles.arrivalDay} ${styles.todayHighlight}` : styles.todayHighlight;
    }
    
    // Otherwise check for arrivals
    if (hasArrivals(date)) {
      return styles.arrivalDay;
    }
    
    return "";
  };

  return (
    <header className={styles.headerContainer}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.actionsSection}>
        <div className={styles.actionItem}>
          <NotificationsDropdown notifications={onlineReservationNotifications} />
        </div>

        <div className={styles.datePickerContainer}>
          <button onClick={toggleCalendar} className={styles.dateDisplayButton} title="Open Calendar">
            <i className={`fa-regular fa-calendar-day ${styles.icon} ${styles.calendarIcon}`}></i>
            <span>{formattedDate}</span>
          </button>
          {isCalendarOpen && (
            <div className={styles.calendarDropdown}>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                inline
                dayClassName={dayClassName}
                highlightDates={[todayDate]} // Highlight today's date
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;