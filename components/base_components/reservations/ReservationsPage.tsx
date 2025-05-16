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
import { supabase } from "@/lib/supabaseClient";

const ITEMS_PER_PAGE = 6;

const ReservationsPage: React.FC = () => {
  const {
    reservations,
    customerLookup,
    staffLookup,
    roomLookup,
    isLoading,
    error,
    refreshReservations
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

  const [currentPage, setCurrentPage] = useState(1);
  const [currentReservations, setCurrentReservations] = useState<ReservationItem[]>([]);
  const [animateTable, setAnimateTable] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);

  const roomOptions: RoomOption[] = Object.entries(roomLookup).map(([id, room]) => ({
    id,
    name: room.name
  }));

  useEffect(() => {
    setAnimateStats(false);
    const timer = setTimeout(() => setAnimateStats(true), 50);
    return () => clearTimeout(timer);
  }, [reservationType]);

  useEffect(() => {
    const rooms = Object.entries(roomLookup).map(([id, room]) => `${room.name} (${id})`);
    setAvailableRooms(rooms);
  }, [roomLookup]);

  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, reservationType, filterOptions]);

  useEffect(() => {
    setAnimateTable(false);

    if (filteredReservations.length === 0) {
      setCurrentReservations([]);
      const timer = setTimeout(() => setAnimateTable(true), 50);
      return () => clearTimeout(timer);
    }

    let newCurrentPage = currentPage;
    if (newCurrentPage > totalPages) newCurrentPage = totalPages;
    if (newCurrentPage < 1 && totalPages > 0) newCurrentPage = 1;

    const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentReservations(filteredReservations.slice(startIndex, endIndex));

    const timer = setTimeout(() => setAnimateTable(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage, filteredReservations, totalPages]);

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

  const handleApplyFilters = (filters: FilterOptions): void => {
    setFilterOptions(filters);
    setIsFilterOpen(false);
  };

  const handleRowClick = (reservation: ReservationItem) => {
    setSelectedReservation(reservation);
  };

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    const { data: reservationData, error: fetchError } = await supabase
      .from("reservations")
      .select("source, customer_id, room_id, check_in, check_out, confirmation_time")
      .eq("id", reservationId)
      .single();

    if (fetchError || !reservationData) {
      console.error("Failed to fetch reservation source:", fetchError?.message);
      alert("Unable to update reservation status.");
      return;
    }

    const updatePayload: any = {
      status: newStatus,
      payment_received: newStatus === "Accepted",
      last_updated: new Date().toISOString(),
      status_updated_at: new Date().toISOString()
    };

    if (newStatus === "Confirmed_Pending_Payment") {
      updatePayload.confirmation_time = new Date().toISOString();
    } else if (newStatus === "Accepted") {
      updatePayload.confirmation_time = reservationData.confirmation_time ?? new Date().toISOString();
    } else {
      updatePayload.confirmation_time = null;
    }

    const { error: updateError } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", reservationId);

    if (updateError) {
      console.error("Failed to update status:", updateError.message);
      alert("Failed to update reservation status.");
      return;
    }

    if (reservationData.source === "mobile") {
      console.log("🔔 Would send notification to customer:", reservationData.customer_id);
      // TODO: Integrate Firebase push notification logic here.
    } else {
      console.log("📵 No notification sent (source is staff_manual)");
    }

    await refreshReservations();
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
            onStatusChange={(id, newStatus) => {
              const reservation = currentReservations.find(r => r.id === id);
              if (!reservation) return;
              const source = reservation.source;
              const currentStatus = reservation.status;

              const allowedStatuses = [];
              if (source === "staff_manual") {
                allowedStatuses.push("Confirmed_Pending_Payment", "Accepted");
              } else if (source === "mobile" && currentStatus === "Pending") {
                allowedStatuses.push("Confirmed_Pending_Payment", "Rejected");
              } else {
                allowedStatuses.push("Pending", "Confirmed_Pending_Payment", "Accepted", "Rejected");
              }

              if (!allowedStatuses.includes(newStatus)) {
                alert("Invalid status transition for this reservation source.");
                return;
              }

              handleStatusChange(id, newStatus);
            }}
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
        onExport={(data) => console.log("Export data:", data)}
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
