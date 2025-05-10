// components/Header/Header.tsx
"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';

import styles from "./Header.module.css";

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
          <div className={styles.iconTooltipWrapper}>
            <i className={`fa-regular fa-file-export ${styles.icon}`}></i>
            <span className={styles.tooltipText}>Export Data</span>
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
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;