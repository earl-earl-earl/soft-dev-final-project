import React from "react";
import styles from "../../../components/component_styles/Reservations.module.css";

interface ReservationFiltersProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onOpenAdvancedFilters: () => void;
  onOpenExport: () => void;
}

const ReservationFilters: React.FC<ReservationFiltersProps> = ({
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchTermChange,
  onOpenAdvancedFilters,
  onOpenExport
}) => {
  return (
    <div className={styles.listHeader}>
      <h2 className={styles.listTitle}>
        Reservation List
      </h2>
      <div className={styles.actionButtons}>
        <div className={styles.listControls}>
          <div className={styles.statusFilterWrapper}>
            <div className={styles.iconTooltipWrapper}>
              <select 
                className={styles.statusFilter}
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Accepted">Accepted</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
                <option value="Confirmed_Pending_Payment">Confirmed Pending Payment</option>
              </select>
              <span className={styles.tooltipText}>Filter by status</span>
            </div>
          </div>
          <div className={styles.searchBar}>
            <i
              className={`fa-regular fa-magnifying-glass ${styles.searchIcon}`}
            ></i>
            <input
              type="text"
              placeholder="Search..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
            />
          </div>
          <div className={styles.iconTooltipWrapper}>
            <button 
              className={styles.filterButton}
              onClick={onOpenAdvancedFilters}
            >
              <i className="fa-regular fa-filter"></i>
              <span className={styles.tooltipText}>Advanced Filters</span>
            </button>
          </div>
        </div>
        <div className={styles.exportAction}>
          <div className={styles.iconTooltipWrapper}>
            <button 
              className={styles.exportButton}
              onClick={onOpenExport}>
              <i className="fa-regular fa-file-export"></i>
              <span className={styles.tooltipText}>Export Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationFilters;