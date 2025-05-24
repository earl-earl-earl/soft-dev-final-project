import React from 'react';
import ReactDOM from 'react-dom';
import styles from '../../component_styles/StaffFeature.module.css';
import { ACCESS_LEVELS, ADMIN_FORM_SELECTABLE_ROLES, AdminMember, FilterOptions } from '../../../src/types/admin';

interface AdminFiltersProps {
 isOpen: boolean;
  onClose: () => void;
  filterOptions: FilterOptions;
  onFilterChange: (name: keyof FilterOptions, value: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  onToggleSortDirection: (field: keyof AdminMember) => void;
}

const AdminFilters: React.FC<AdminFiltersProps> = ({
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
          <h3>Filter & Sort Admins</h3>
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
              {ADMIN_FORM_SELECTABLE_ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="accessLevelFilter">Access Level</label>
            <select
              id="accessLevelFilter"
              value={filterOptions.accessLevelFilter}
              onChange={(e) => onFilterChange('accessLevelFilter' as keyof FilterOptions, e.target.value)}
              className={styles.formControl}
            >
              <option value="">All Access Levels</option>
              {ACCESS_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
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
                <option value="accessLevel">Access Level</option>
              </select>
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label htmlFor="sortDirection">Direction</label>
              <div className={styles.sortDirectionToggle}>
                <button 
                  type="button"
                  onClick={() => {
                    if (filterOptions.sortField) {
                      onToggleSortDirection(filterOptions.sortField as keyof AdminMember);
                    }
                  }}
                  className={styles.sortDirectionButton}
                  disabled={!filterOptions.sortField}
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

export default AdminFilters;