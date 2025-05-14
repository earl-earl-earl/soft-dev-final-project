// components/Header/Header.tsx
"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isSameDay } from 'date-fns';

import styles from "../component_styles/Header.module.css";
import { reservationsData } from './Reservations'; 

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [todayDate] = useState<Date>(new Date()); // Store today's date separately
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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
    return reservationsData.some(reservation => {
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
          <div className={styles.iconTooltipWrapper}>
            <i className={`fa-regular fa-bell ${styles.icon}`}></i>
            <span className={styles.tooltipText}>Notifications</span>
          </div>
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