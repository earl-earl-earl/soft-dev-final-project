import React from 'react';
import styles from '../../component_styles/StaffFeature.module.css';

interface StaffListProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFilterClick: () => void;
  onAddStaffClick: () => void;
}

const StaffList: React.FC<StaffListProps> = ({
  searchTerm,
  onSearchChange,
  onFilterClick,
  onAddStaffClick
}) => {
  return (
    <div className={styles.controlsHeader}>
      <div className={styles.searchBar}>
        <i className={`fa-regular fa-magnifying-glass ${styles.searchIcon}`}></i>
        <input
          type="text"
          placeholder="Search staff by username"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button className={styles.filterButton} title="Filter" onClick={onFilterClick}>
          <i className="fa-regular fa-filter"></i>
          <span className={styles.tooltipText}>Filter</span>
        </button>
      </div>
      <button className={styles.addButton} onClick={onAddStaffClick}>
        <i className="fa-regular fa-plus"></i> Add New Staff
      </button>
    </div>
  );
};

export default StaffList;