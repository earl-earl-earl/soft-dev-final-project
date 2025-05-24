import React from 'react';
import styles from '../../component_styles/StaffFeature.module.css';

interface AdminListProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onFilterClick: () => void;
  onAddAdminClick: () => void;
canAddAdmin: boolean;
}

const AdminList: React.FC<AdminListProps> = ({
  searchTerm,
  onSearchChange,
  onFilterClick,
  onAddAdminClick
}) => {
  return (
    <div className={styles.controlsHeader}>
      <div className={styles.searchBar}>
        <i className={`fa-regular fa-magnifying-glass ${styles.searchIcon}`}></i>
        <input
          type="text"
          placeholder="Search admin by username or name"
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button className={styles.filterButton} title="Filter" onClick={onFilterClick}>
          <i className="fa-regular fa-filter"></i>
          <span className={styles.tooltipText}>Filter</span>
        </button>
      </div>
      <button className={styles.addButton} onClick={onAddAdminClick}>
        <i className="fa-regular fa-plus"></i> Add New Admin
      </button>
    </div>
  );
};

export default AdminList;