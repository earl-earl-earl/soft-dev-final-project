import React from 'react';
import ReactDOM from 'react-dom';
import styles from '../../component_styles/StaffFeature.module.css';
import { FilterOptions, POSITIONS, ROLES } from '../../../src/types/staff';

interface StaffFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filterOptions: FilterOptions;
  onFilterChange: (name: keyof FilterOptions, value: string | 'asc' | 'desc') => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onToggleSortDirection: () => void;
}

const StaffFilters: React.FC<StaffFiltersProps> = ({
  isOpen,
  onClose,
  filterOptions,
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  onToggleSortDirection
}) => {
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Filter & Sort Staff</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-times"></i>
          </button>
        </div>
        <div className={styles.modalBody}>
          <h4 className={styles.formSectionTitle}>Filters</h4>
          <div className={styles.formGroup}>
            <label htmlFor="nameFilter">Name</label>
            <input
              type="text"
              id="nameFilter"
              value={filterOptions.nameFilter}
              onChange={(e) => onFilterChange('nameFilter', e.target.value)}
              className={styles.formControl}
              placeholder="Filter by name"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="emailFilter">Email</label>
            <input
              type="text"
              id="emailFilter"
              value={filterOptions.emailFilter}
              onChange={(e) => onFilterChange('emailFilter', e.target.value)}
              className={styles.formControl}
              placeholder="Filter by email"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="phoneFilter">Phone Number</label>
            <input
              type="text"
              id="phoneFilter"
              value={filterOptions.phoneFilter}
              onChange={(e) => onFilterChange('phoneFilter', e.target.value)}
              className={styles.formControl}
              placeholder="Filter by phone number"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="roleFilter">Role</label>
            <select
              id="roleFilter"
              value={filterOptions.roleFilter}
              onChange={(e) => onFilterChange('roleFilter', e.target.value)}
              className={styles.formControl}
            >
              <option value="">All Roles</option>
              {ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="positionFilter">Position</label>
            <select
              id="positionFilter"
              value={filterOptions.positionFilter}
              onChange={(e) => onFilterChange('positionFilter', e.target.value)}
              className={styles.formControl}
            >
              <option value="">All Positions</option>
              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
          
          <h4 className={styles.formSectionTitle}>Sorting</h4>
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: 2 }}>
              <label htmlFor="sortField">Sort By</label>
              <select
                id="sortField"
                value={filterOptions.sortField}
                onChange={(e) => onFilterChange('sortField', e.target.value)}
                className={styles.formControl}
              >
                <option value="name">Name</option>
                <option value="username">Username</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="position">Position</option>
              </select>
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label htmlFor="sortDirection">Direction</label>
              <div className={styles.sortDirectionToggle}>
                <button 
                  type="button"
                  onClick={onToggleSortDirection}
                  className={styles.sortDirectionButton}
                >
                  {filterOptions.sortDirection === 'asc' ? (
                    <><i className="fa-regular fa-arrow-up-a-z"></i> Ascending</>
                  ) : (
                    <><i className="fa-regular fa-arrow-down-z-a"></i> Descending</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.secondaryButton} onClick={onResetFilters}>
            Clear All
          </button>
          <button className={styles.primaryButton} onClick={onApplyFilters}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StaffFilters;