import React from 'react';
import styles from '../../component_styles/Rooms.module.css';

interface RoomsHeaderProps {
  searchTerm: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  statusFilter: 'all' | 'Occupied' | 'Vacant';
  onStatusFilterChange: (status: 'all' | 'Occupied' | 'Vacant') => void;
  onOpenFilters: () => void;
  onAddRoom: () => void;
}

const RoomsHeader: React.FC<RoomsHeaderProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onOpenFilters,
  onAddRoom
}) => {
  return (
    <div className={styles.roomsHeader}>
      <h2>Rooms</h2>
      <div className={styles.headerActions}>
        <div className={styles.searchContainer}>
          <div className={styles.statusFilter}>
            <button 
              className={`${styles.statusButton} ${statusFilter === "all" ? styles.activeFilter : ""}`}
              onClick={() => onStatusFilterChange("all")}
            >
              All
            </button>
            <button 
              className={`${styles.statusButton} ${statusFilter === "Occupied" ? styles.activeFilter : ""}`}
              onClick={() => onStatusFilterChange("Occupied")}
            >
              Occupied
            </button>
            <button 
              className={`${styles.statusButton} ${statusFilter === "Vacant" ? styles.activeFilter : ""}`}
              onClick={() => onStatusFilterChange("Vacant")}
            >
              Vacant
            </button>
          </div>
          <div className={styles.searchBar}>
            <i className={`fa-regular fa-magnifying-glass ${styles.searchIcon}`}></i>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search rooms"
              value={searchTerm}
              onChange={onSearchChange}
            />
          </div>
          <button className={styles.filterButton} onClick={onOpenFilters}>
            <i className="fa-regular fa-filter"></i>
            <span className={styles.tooltipText}>Filter</span>
          </button>
        </div>
        <button className={styles.newRoomButton} onClick={onAddRoom}>
          <i className="fa-regular fa-plus"></i> New Room
        </button>
      </div>
    </div>
  );
};

export default RoomsHeader;