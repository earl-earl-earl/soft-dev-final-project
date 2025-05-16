import React, { useState, useEffect } from "react";
import styles from "../../../components/component_styles/Reservations.module.css";
import { useReservations } from "../../../src/hooks/useReservations";
import { useFilteredReservations } from "../../../src/hooks/useFilteredReservations";
import { ReservationItem, FilterOptions, RoomOption } from "../../../src/types/reservation";
import { submitReservation } from "@/contexts/newReservation";

// Import Components
import ReservationTable from "./ReservationTable";
import ReservationTabs from "./ReservationTabs";
import ReservationStats from "./ReservationStats";
import ReservationFilters from "./ReservationFilters";
import Pagination from "../../common/Pagination";
import NewReservationOverlay, { ReservationData } from "../../overlay_components/NewReservationOverlay";
import FilterOverlay from "../../overlay_components/FilterOverlay";
import ExportOverlay from "../../overlay_components/ExportOverlay";
import ReservationDetailsOverlay from "../../overlay_components/ReservationDetailsOverlay";

const ITEMS_PER_PAGE = 6;

const ReservationsPage: React.FC = () => {
  // State from hooks
  const {
    reservations,
    customerLookup,
    staffLookup,
    roomLookup,
    isLoading,
    error,
    refreshReservations,
    handleStatusChange
  } = useReservations();

  const {
    filteredReservations,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    reservationType,
    setReservationType,
    filterOptions,
    setFilterOptions,
    statistics
  } = useFilteredReservations({
    reservations,
    customerLookup,
    roomLookup
  });

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentReservations, setCurrentReservations] = useState<ReservationItem[]>([]);
  const [animateTable, setAnimateTable] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);

  // Derived room options for filter
  const roomOptions: RoomOption[] = Object.entries(roomLookup).map(([id, details]) => ({
    id,
    name: details.name || id
  }));

  // Animation effect for stats
  useEffect(() => {
    setAnimateStats(false);
    const timer = setTimeout(() => setAnimateStats(true), 50);
    return () => clearTimeout(timer);
  }, [reservationType]);

  // Generate available rooms from roomLookup for the overlay
  useEffect(() => {
    const rooms = Object.entries(roomLookup).map(([id, details]) => `${details.name} (${id})`);
    setAvailableRooms(rooms);
  }, [roomLookup]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, reservationType, filterOptions]);

  // Update currentReservations when pagination or filters change
  useEffect(() => {
    setAnimateTable(false);
    
    if (filteredReservations.length === 0) {
      setCurrentReservations([]);
      const timer = setTimeout(() => setAnimateTable(true), 50);
      return () => clearTimeout(timer);
    }
    
    let newCurrentPage = currentPage;
    
    if (newCurrentPage > totalPages) {
      newCurrentPage = totalPages;
    }
    if (newCurrentPage < 1 && totalPages > 0) {
      newCurrentPage = 1;
    }
    
    const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentReservations(filteredReservations.slice(startIndex, endIndex));
    
    const timer = setTimeout(() => setAnimateTable(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage, filteredReservations, totalPages]);

  // Handle new reservation submission
  const handleNewReservation = async (reservationData: ReservationData) => {
    try {
      const result = await submitReservation(reservationData);
      if (result.success) {
        alert("Reservation successfully created!");
        setIsNewReservationOpen(false);
        await refreshReservations();
      } else {
        alert("Failed to create reservation: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      alert("An error occurred while creating the reservation.");
      console.error("Error submitting reservation:", error);
    }
  };

  // Handle applying advanced filters
  const handleApplyFilters = (filters: FilterOptions): void => {
    setFilterOptions(filters);
    setIsFilterOpen(false);
  };

  // Handle row click to show reservation details
  const handleRowClick = (reservation: ReservationItem) => {
    setSelectedReservation(reservation);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topContent}>
        <ReservationTabs
          reservationType={reservationType}
          onTypeChange={setReservationType}
          onNewReservation={() => setIsNewReservationOpen(true)}
        />

        <ReservationStats
          statistics={statistics}
          animate={animateStats}
        />

        <div className={styles.reservationListSection}>
          <ReservationFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onOpenAdvancedFilters={() => setIsFilterOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
          />

          <ReservationTable
            reservations={currentReservations}
            customerLookup={customerLookup}
            roomLookup={roomLookup}
            staffLookup={staffLookup}
            onRowClick={handleRowClick}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
            error={error}
            onRetry={refreshReservations}
            animate={animateTable}
          />
        </div>
      </div>

      {!isLoading && !error && filteredReservations.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <NewReservationOverlay
        isOpen={isNewReservationOpen}
        onClose={() => setIsNewReservationOpen(false)}
        onSubmit={handleNewReservation}
        availableRooms={availableRooms}
      />

      <FilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filterOptions}
        roomOptions={roomOptions}
      />
      
      <ExportOverlay
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={(data) => console.log('Export data:', data)}
      />

      <ReservationDetailsOverlay
        isOpen={selectedReservation !== null}
        onClose={() => setSelectedReservation(null)}
        reservation={selectedReservation}
        customerLookup={customerLookup}
        roomLookup={roomLookup}
        staffLookup={staffLookup}
      />
    </div>
  );
};

export default ReservationsPage;