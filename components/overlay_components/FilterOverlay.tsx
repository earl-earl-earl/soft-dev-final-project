import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from '../component_styles/FilterOverlay.module.css';

interface FilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
  roomOptions: { id: string; name: string }[];
}

export interface FilterOptions {
  checkInStart: string;
  checkInEnd: string;
  checkOutStart: string;
  checkOutEnd: string;
  paymentStatus: string;
  minGuests: string;
  maxGuests: string;
  roomId: string;
}

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
  roomOptions
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null, fieldName: string) => {
    if (date) {
      // Format date to YYYY-MM-DD string
      const formattedDate = date.toISOString().split('T')[0];
      setFilters(prev => ({ ...prev, [fieldName]: formattedDate }));
    } else {
      setFilters(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({
      checkInStart: '',
      checkInEnd: '',
      checkOutStart: '',
      checkOutEnd: '',
      paymentStatus: 'all',
      minGuests: '',
      maxGuests: '',
      roomId: 'all'
    });
  };

  // Parse date strings to Date objects for DatePicker
  const getDateFromString = (dateString: string): Date | undefined => {
    return dateString ? new Date(dateString) : undefined;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.filterOverlayContent}>
        <div className={styles.overlayHeader}>
          <h2>Advanced Filters</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-xmark"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.filterForm}>
          <div className={styles.filterSection}>
            <h3>Check-in Date Range</h3>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label>From:</label>
                <DatePicker
                  selected={getDateFromString(filters.checkInStart)}
                  onChange={(date) => handleDateChange(date, 'checkInStart')}
                  selectsStart
                  startDate={getDateFromString(filters.checkInStart)}
                  endDate={getDateFromString(filters.checkInEnd)}
                  placeholderText="Select start date"
                  dateFormat="MMM d, yyyy"
                  className={styles.datePicker}
                />
              </div>
              <div className={styles.filterField}>
                <label>To:</label>
                <DatePicker
                  selected={getDateFromString(filters.checkInEnd)}
                  onChange={(date) => handleDateChange(date, 'checkInEnd')}
                  selectsEnd
                  startDate={getDateFromString(filters.checkInStart)}
                  endDate={getDateFromString(filters.checkInEnd)}
                  minDate={getDateFromString(filters.checkInStart)}
                  placeholderText="Select end date"
                  dateFormat="MMM d, yyyy"
                  className={styles.datePicker}
                />
              </div>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Check-out Date Range</h3>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label>From:</label>
                <DatePicker
                  selected={getDateFromString(filters.checkOutStart)}
                  onChange={(date) => handleDateChange(date, 'checkOutStart')}
                  selectsStart
                  startDate={getDateFromString(filters.checkOutStart)}
                  endDate={getDateFromString(filters.checkOutEnd)}
                  placeholderText="Select start date"
                  dateFormat="MMM d, yyyy"
                  className={styles.datePicker}
                />
              </div>
              <div className={styles.filterField}>
                <label>To:</label>
                <DatePicker
                  selected={getDateFromString(filters.checkOutEnd)}
                  onChange={(date) => handleDateChange(date, 'checkOutEnd')}
                  selectsEnd
                  startDate={getDateFromString(filters.checkOutStart)}
                  endDate={getDateFromString(filters.checkOutEnd)}
                  minDate={getDateFromString(filters.checkOutStart)}
                  placeholderText="Select end date"
                  dateFormat="MMM d, yyyy"
                  className={styles.datePicker}
                />
              </div>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Payment Status</h3>
            <div className={styles.filterField}>
              <select 
                name="paymentStatus" 
                value={filters.paymentStatus}
                onChange={handleChange}
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Not Paid</option>
              </select>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Number of Guests</h3>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label>Min:</label>
                <input 
                  type="number" 
                  name="minGuests" 
                  value={filters.minGuests}
                  onChange={handleChange}
                  min="1"
                />
              </div>
              <div className={styles.filterField}>
                <label>Max:</label>
                <input 
                  type="number" 
                  name="maxGuests" 
                  value={filters.maxGuests}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Room</h3>
            <div className={styles.filterField}>
              <select 
                name="roomId" 
                value={filters.roomId}
                onChange={handleChange}
              >
                <option value="all">All Rooms</option>
                {roomOptions.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filterActions}>
            <button type="button" className={styles.resetButton} onClick={handleReset}>
              Reset Filters
            </button>
            <button type="submit" className={styles.applyButton}>
              Apply Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilterOverlay;