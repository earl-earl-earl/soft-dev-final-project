// components/Header/Header.tsx
"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, isSameDay } from 'date-fns';

import styles from "../component_styles/Header.module.css";
import { reservationsData } from '@components/base_components/Reservations'; // Import directly from the Reservations component

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  const formattedDate = selectedDate ? format(selectedDate, "E, dd MMM") : "Select Date";

  // Function to determine if a date has confirmed arrivals
  const hasArrivals = (date: Date) => {
    return reservationsData.some(reservation => {
      const isConfirmed = reservation.status.includes('CONFIRMED');
      return isConfirmed && isSameDay(date, reservation.checkIn);
    });
  };

  // Custom day class function for DatePicker
  const dayClassName = (date: Date) => {
    if (hasArrivals(date)) {
      return styles.arrivalDay;
    }
    return ""; // Return empty string instead of undefined
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
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;