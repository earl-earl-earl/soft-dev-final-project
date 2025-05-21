// FilterOverlay.tsx
import React, { useState, useEffect } from 'react'; 
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from '../component_styles/FilterOverlay.module.css';

// Define the possible values for the paymentStatus filter in this component
// This should align with the derived statuses used in useFilteredReservations
export type PaymentFilterStatusValue = 
  | 'all' 
  | 'Payment Pending' 
  | 'Awaiting Downpayment' 
  | 'Downpayment Paid' 
  | 'Fully Paid' 
  | 'Not Applicable' 
  | 'Rejected – No Payment Recorded';

// options that will appear in the dropdown
const PAYMENT_STATUS_OPTIONS: { value: PaymentFilterStatusValue; label: string }[] = [
  { value: 'all', label: 'All Payment Statuses' },
  { value: 'Payment Pending', label: 'Payment Pending' },
  { value: 'Awaiting Downpayment', label: 'Awaiting Downpayment' },
  { value: 'Downpayment Paid', label: 'Downpayment Paid' },
  { value: 'Fully Paid', label: 'Fully Paid' },
  { value: 'Not Applicable', label: 'Not Applicable (e.g., Cancelled/Expired)' },
  { value: 'Rejected – No Payment Recorded', label: 'Rejected – No Payment Recorded' },
];

export interface FilterOptions {
  checkInStart: string;
  checkInEnd: string;
  checkOutStart: string;
  checkOutEnd: string;
  paymentStatus: PaymentFilterStatusValue; 
  minGuests: string;
  maxGuests: string;
  roomId: string;
}

interface FilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters: FilterOptions; // Parent should pass FilterOptions with correct paymentStatus type
  roomOptions: { id: string; name: string }[]; // RoomOption from types/reservation.ts
}

const FilterOverlay: React.FC<FilterOverlayProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilters,
  roomOptions
}) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  // Effect to reset local filters when initialFilters prop changes
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, isOpen]); // Also depend on isOpen to reset when re-opened

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ 
        ...prev, 
        [name]: name === "paymentStatus" ? value as PaymentFilterStatusValue : value 
    }));
  };

  const handleDateChange = (date: Date | null, fieldName: keyof FilterOptions) => { // Use keyof for type safety
    if (date && !isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      setFilters(prev => ({ ...prev, [fieldName]: formattedDate }));
    } else {
      setFilters(prev => ({ ...prev, [fieldName]: '' })); // Clear if date is null or invalid
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(filters);
  };

  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      checkInStart: '',
      checkInEnd: '',
      checkOutStart: '',
      checkOutEnd: '',
      paymentStatus: 'all', // Reset to 'all' or any default value
      minGuests: '',
      maxGuests: '',
      roomId: 'all' // Reset to 'all' or any default value
    };
    setFilters(defaultFilters);
    // call onApply immediately with reset filters if needed
    // onApply(defaultFilters); 
  };

  // Helper to parse date strings from filters state to Date objects for DatePicker
  // Ensures that DatePicker gets a valid Date or null.
  const getDateForPicker = (dateString: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }
    return isNaN(date.getTime()) ? null : date;
  };


  return (
    <div className={styles.overlay} onClick={onClose}> {/* Close on backdrop click */}
      <div className={styles.filterOverlayContent} onClick={(e) => e.stopPropagation()}> {/* Prevent closing on content click */}
        <div className={styles.overlayHeader}>
          <h2>Advanced Filters</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-xmark"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.filterForm}>
          {/* Check-in Date Range */}
          <div className={styles.filterSection}>
            <h3>Check-in Date Range</h3>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label htmlFor="checkInStart">From:</label>
                <DatePicker
                  id="checkInStart"
                  selected={getDateForPicker(filters.checkInStart)}
                  onChange={(date) => handleDateChange(date, 'checkInStart')}
                  selectsStart
                  startDate={getDateForPicker(filters.checkInStart)}
                  endDate={getDateForPicker(filters.checkInEnd)}
                  placeholderText="Any"
                  dateFormat="MMM d, yyyy"
                  className={styles.datePicker}
                  isClearable // Allow clearing the date
                />
              </div>
              <div className={styles.filterField}>
                <label htmlFor="checkInEnd">To:</label>
                <DatePicker
                  id="checkInEnd"
                  selected={getDateForPicker(filters.checkInEnd)}
                  onChange={(date) => handleDateChange(date, 'checkInEnd')}
                  selectsEnd
                  startDate={getDateForPicker(filters.checkInStart)}
                  endDate={getDateForPicker(filters.checkInEnd)}
                  minDate={getDateForPicker(filters.checkInStart) || undefined}
                  placeholderText="Any"
                  dateFormat="MMM d, yyyy"
                  className={styles.datePicker}
                  isClearable
                />
              </div>
            </div>
          </div>

          {/* Check-out Date Range */}
          <div className={styles.filterSection}>
            <h3>Check-out Date Range</h3>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label htmlFor="checkOutStart">From:</label>
                <DatePicker
                  id="checkOutStart"
                  selected={getDateForPicker(filters.checkOutStart)}
                  onChange={(date) => handleDateChange(date, 'checkOutStart')}
                  selectsStart
                  startDate={getDateForPicker(filters.checkOutStart)}
                  endDate={getDateForPicker(filters.checkOutEnd)}
                  placeholderText="Any"
                  dateFormat="MMM d, yyyy"
                  className={styles.datePicker}
                  isClearable
                />
              </div>
              <div className={styles.filterField}>
                <label htmlFor="checkOutEnd">To:</label>
                <DatePicker
                  id="checkOutEnd"
                  selected={getDateForPicker(filters.checkOutEnd)}
                  onChange={(date) => handleDateChange(date, 'checkOutEnd')}
                  selectsEnd
                  startDate={getDateForPicker(filters.checkOutStart)}
                  endDate={getDateForPicker(filters.checkOutEnd)}
                  minDate={getDateForPicker(filters.checkOutStart) || undefined}
                  placeholderText="Any"
                  dateFormat="MMM d, yyyy"
                  className={styles.datePicker}
                  isClearable
                />
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className={styles.filterSection}>
            <h3>Payment Status</h3>
            <div className={styles.filterField}>
              <select 
                name="paymentStatus" 
                value={filters.paymentStatus}
                onChange={handleChange}
                className={styles.filterSelect}
              >
                {PAYMENT_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Number of Guests */}
          <div className={styles.filterSection}>
            <h3>Number of Guests</h3>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label htmlFor="minGuests">Min:</label>
                <input 
                  id="minGuests"
                  type="number" 
                  name="minGuests" 
                  value={filters.minGuests}
                  onChange={handleChange}
                  min="1" // A booking should have at least 1 guest
                  placeholder="Any"
                  className={styles.filterInput}
                />
              </div>
              <div className={styles.filterField}>
                <label htmlFor="maxGuests">Max:</label>
                <input 
                  id="maxGuests"
                  type="number" 
                  name="maxGuests" 
                  value={filters.maxGuests}
                  onChange={handleChange}
                  min={filters.minGuests || "1"} // Max should be >= Min
                  placeholder="Any"
                  className={styles.filterInput} 
                />
              </div>
            </div>
          </div>

          {/* Room */}
          <div className={styles.filterSection}>
            <h3>Room</h3>
            <div className={styles.filterField}>
              <select 
                name="roomId" 
                value={filters.roomId}
                onChange={handleChange}
                className={styles.filterSelect} 
              >
                <option value="all">All Rooms</option>
                {roomOptions.map(room => (
                  // roomOptions passed from parent is {id, name}
                  <option key={room.id} value={room.id}> 
                    {room.name}
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