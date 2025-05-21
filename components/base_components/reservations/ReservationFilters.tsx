// ReservationFilters.tsx
import React from "react";
import styles from "../../../components/component_styles/Reservations.module.css";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { StatusValue } from "../../../src/types/reservation"; // Import StatusValue for typing

interface ReservationFiltersProps {
  statusFilter: string; 
  onStatusFilterChange: (status: string) => void; 
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onOpenAdvancedFilters: () => void;
  onOpenExport: () => void;
}

// Define the options for the status filter dropdown
const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Confirmed_Pending_Payment", label: "Confirmed Pending Payment" },
  { value: "Accepted", label: "Accepted" },
  { value: "Checked_In", label: "Checked In" },
  { value: "Checked_Out", label: "Checked Out" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Rejected", label: "Rejected" },
  { value: "Expired", label: "Expired" },
  { value: "No_Show", label: "No Show" },
];


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
        {/* {statusFilter !== 'all' && <span className={styles.currentFilterChip}>Status: {statusFilter.replace(/_/g, " ")}</span>} */}
      </h2>
      <div className={styles.actionsContainer}>
        <div className={styles.listControls}>
          <div className={styles.statusFilterWrapper}>
            <div className={styles.iconTooltipWrapper}>
              <select 
                className={styles.statusFilter}
                value={statusFilter} 
                onChange={(e) => onStatusFilterChange(e.target.value)}
              >
                {STATUS_FILTER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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