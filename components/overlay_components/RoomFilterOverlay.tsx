import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styles from '../component_styles/FilterOverlay.module.css';

// Room-specific filter options with added sorting
export interface RoomFilterOptions {
  minCapacity: string;
  maxCapacity: string;
  minPrice: string;
  maxPrice: string;
  availableFrom: string;
  availableTo: string;
  isActive: 'all' | 'active' | 'inactive';
  sortBy: 'name_asc' | 'name_desc' | 'id_asc' | 'id_desc' | 'none';
}

interface RoomFilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: RoomFilterOptions) => void;
  initialFilters: RoomFilterOptions;
}

const RoomFilterOverlay: React.FC<RoomFilterOverlayProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilters
}) => {
  const [filters, setFilters] = useState<RoomFilterOptions>(initialFilters);
  
  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null, fieldName: string) => {
    if (date) {
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
      minCapacity: '',
      maxCapacity: '',
      minPrice: '',
      maxPrice: '',
      availableFrom: '',
      availableTo: '',
      isActive: 'all',
      sortBy: 'none'
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
          <h2>Room Filters</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-xmark"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.filterForm}>
          {/* Sort options - NEW */}
          <div className={styles.filterSection}>
            <h3>Sort By</h3>
            <div className={styles.filterField}>
              <select 
                name="sortBy" 
                value={filters.sortBy}
                onChange={handleChange}
              >
                <option value="none">No sorting</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="id_asc">Room ID (Low to High)</option>
                <option value="id_desc">Room ID (High to Low)</option>
              </select>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Capacity</h3>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label>Min Guests:</label>
                <input 
                  type="number" 
                  name="minCapacity" 
                  value={filters.minCapacity}
                  onChange={handleChange}
                  min="1"
                  placeholder="Min capacity"
                />
              </div>
              <div className={styles.filterField}>
                <label>Max Guests:</label>
                <input 
                  type="number" 
                  name="maxCapacity" 
                  value={filters.maxCapacity}
                  onChange={handleChange}
                  min="1"
                  placeholder="Max capacity"
                />
              </div>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Price Range (PHP)</h3>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label>Min Price:</label>
                <input 
                  type="number" 
                  name="minPrice" 
                  value={filters.minPrice}
                  onChange={handleChange}
                  min="0"
                  placeholder="Min price"
                />
              </div>
              <div className={styles.filterField}>
                <label>Max Price:</label>
                <input 
                  type="number" 
                  name="maxPrice" 
                  value={filters.maxPrice}
                  onChange={handleChange}
                  min="0"
                  placeholder="Max price"
                />
              </div>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Available Date Range</h3>
            <div className={styles.filterRow}>
              <div className={styles.filterField}>
                <label>From:</label>
                <DatePicker
                  selected={getDateFromString(filters.availableFrom)}
                  onChange={(date) => handleDateChange(date, 'availableFrom')}
                  selectsStart
                  startDate={getDateFromString(filters.availableFrom)}
                  endDate={getDateFromString(filters.availableTo)}
                  placeholderText="Select start date"
                  dateFormat="MMM d, yyyy"
                  className={styles.datePicker}
                />
              </div>
              <div className={styles.filterField}>
                <label>To:</label>
                <DatePicker
                  selected={getDateFromString(filters.availableTo)}
                  onChange={(date) => handleDateChange(date, 'availableTo')}
                  selectsEnd
                  startDate={getDateFromString(filters.availableFrom)}
                  endDate={getDateFromString(filters.availableTo)}
                  minDate={getDateFromString(filters.availableFrom)}
                  placeholderText="Select end date"
                  dateFormat="MMM d, yyyy"
                  className={styles.datePicker}
                />
              </div>
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3>Room Status</h3>
            <div className={styles.filterField}>
              <select 
                name="isActive" 
                value={filters.isActive}
                onChange={handleChange}
              >
                <option value="all">All Rooms</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
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

export default RoomFilterOverlay;