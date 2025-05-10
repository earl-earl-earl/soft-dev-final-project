// components/Header/Header.tsx
"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; // Default styling for the date picker
import { format } from 'date-fns'; // For formatting the displayed date

import styles from "./Header.module.css";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setIsCalendarOpen(false); // Close calendar after selecting a date
  };

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  // Format the date to display like "Wed, 07 May"
  const formattedDate = selectedDate ? format(selectedDate, "E, dd MMM") : "Select Date";

  return (
    <header className={styles.headerContainer}>
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.actionsSection}>
        <div className={styles.actionItem}>
          {/* You can add other icons here if needed in the future */}
          <i className={`fa-regular fa-bell ${styles.icon}`}></i> {/* Example Notification Icon */}
          <i className={`fa-regular fa-file-export ${styles.icon}`}></i>
        </div>

        <div className={styles.datePickerContainer}>
          <button onClick={toggleCalendar} className={styles.dateDisplayButton}>
            <i className={`fa-regular fa-calendar-day ${styles.icon} ${styles.calendarIcon}`}></i>
            <span>{formattedDate}</span>
          </button>
          {isCalendarOpen && (
            <div className={styles.calendarDropdown}>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                inline // Renders the calendar directly without an input field
                // onCalendarClose={() => setIsCalendarOpen(false)} // Alternative way to close
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;