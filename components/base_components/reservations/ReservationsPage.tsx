import React, { useState, useEffect, useRef } from "react";
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentReservations, setCurrentReservations] = useState<ReservationItem[]>([]);
  
  // Overlay states
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);

  // Animation states - updated to match Dashboard approach
  const [animate, setAnimate] = useState(false);
  const loadingFinishedRef = useRef(false);

  // Handle animation after loading finishes
  useEffect(() => {
    if (!isLoading && !loadingFinishedRef.current) {
      loadingFinishedRef.current = true;
      
      // Small delay after loading finishes before starting animations
      setTimeout(() => {
        setAnimate(true);
      }, 100);
    }
  }, [isLoading]);

  // Reset animation when filter type changes
  useEffect(() => {
    setAnimate(false);
    loadingFinishedRef.current = false;
    
    // Small delay before restarting animations
    setTimeout(() => {
      setAnimate(true);
    }, 100);
  }, [reservationType]);

  const roomOptions: RoomOption[] = Object.entries(roomLookup).map(([id, room]) => ({
    id,
    name: room.name
  }));

  useEffect(() => {
    // Fetch ALL rooms directly from the database instead of using roomLookup
    const fetchAllRooms = async () => {
      try {
        const { data: allRooms, error } = await supabase
          .from('rooms')
          .select('id, name, is_active')
          .eq('is_active', true); // Only fetch active rooms
        
        if (error) {
          console.error("Error fetching rooms:", error);
          return;
        }
        
        if (allRooms && allRooms.length > 0) {
          const roomOptions = allRooms.map(room => `${room.name} (${room.id})`);
          console.log("All available rooms for dropdown:", roomOptions);
          setAvailableRooms(roomOptions);
        } else {
          console.log("No rooms found in database");
          setAvailableRooms([]);
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };
    
    fetchAllRooms();
  }, []); // Run once when component mounts, not dependent on roomLookup

  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, reservationType, filterOptions]);

  // Update current reservations when page or filtered data changes
  useEffect(() => {
    let newCurrentPage = currentPage;
    if (newCurrentPage > totalPages) newCurrentPage = totalPages;
    if (newCurrentPage < 1 && totalPages > 0) newCurrentPage = 1;
    
    const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentReservations(filteredReservations.slice(startIndex, endIndex));
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
      {/* STAGGERED ANIMATION: First element */}
      <div className={`${styles.topContent} ${animate ? styles.animateFirst : ""}`}>
        <ReservationTabs
          reservationType={reservationType}
          onTypeChange={setReservationType}
          onNewReservation={() => setIsNewReservationOpen(true)}
        />
        
        {/* Stats cards - animated with staggered delay */}
        <ReservationStats
          statistics={statistics}
          animate={animate}
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

          {/* STAGGERED ANIMATION: Second element */}
          <div className={`${animate ? styles.animateSecond : ""}`}>
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
              animate={animate}
            />
          </div>
        </div>
      </div>

      {/* STAGGERED ANIMATION: Third element */}
      {!isLoading && !error && filteredReservations.length > 0 && totalPages > 1 && (
        <div className={`${animate ? styles.animateThird : ""}`}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
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
