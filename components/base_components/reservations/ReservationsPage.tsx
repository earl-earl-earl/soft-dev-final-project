/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import styles from "../../../components/component_styles/Reservations.module.css";
import { useReservations } from "../../../src/hooks/useReservations";
import { useFilteredReservations } from "../../../src/hooks/useFilteredReservations";
import { ReservationItem, FilterOptions, RoomOption } from "../../../src/types/reservation";
import { submitReservation } from "@/contexts/newReservation";
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

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

  // Move this function up here, right after your hook declarations
  // but before any code that uses it
  const duplicateReservationsForDebugging = (
    reservations: ReservationItem[],
    duplicateCount: number = 5
  ): ReservationItem[] => {
    if (!reservations.length) return [];
    
    const duplicatedData: ReservationItem[] = [];
    
    // Create multiple copies of the original data
    for (let i = 0; i < duplicateCount; i++) {
      reservations.forEach(reservation => {
        // Create a shallow copy with a modified ID to ensure uniqueness
        const duplicatedReservation: ReservationItem = {
          ...reservation,
          id: `${reservation.id}-dup-${i}`
        };
        duplicatedData.push(duplicatedReservation);
      });
    }
    
    return duplicatedData;
  };

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

  // Animation states - simplified to fix issues
  const [animate, setAnimate] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // IMPORTANT: Remove the duplicate useEffect hooks and use a single, cleaner approach
  useEffect(() => {
    if (!isLoading) {
      console.log("Loading finished, preparing animations");
      
      // First transition: show content
      setTimeout(() => {
        setShowContent(true);
        console.log("Content visible");
        
        // Second transition: trigger animations with a delay
        setTimeout(() => {
          console.log("Triggering animations");
          setAnimate(true);
        }, 200); // Increased delay to ensure DOM has updated
      }, 400); // Increased delay for smoother transition
    }
  }, [isLoading]);

  // Reset animation when filter type changes - simplified
  useEffect(() => {
    if (showContent) { // Only reset if content is showing
      console.log("Filter type changed, resetting animations");
      setAnimate(false);
      
      setTimeout(() => {
        console.log("Re-triggering animations after filter change");
        setAnimate(true);
      }, 200);
    }
  }, [reservationType, showContent]);

  // Add this useEffect to reset animations when page changes
  useEffect(() => {
    if (showContent) { // Only reset if content is showing
      console.log("Page changed, resetting animations");
      setAnimate(false);
      
      // Short timeout to ensure the animation reset is visible
      setTimeout(() => {
        console.log("Re-triggering animations after page change");
        setAnimate(true);
      }, 100); // Shorter delay for page changes to make it feel snappier
    }
  }, [currentPage, showContent]); // React to page changes

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

  const totalPages = React.useMemo(() => {
    // Debug flag - should match the same flag in the useEffect above
    const DEBUG_PAGINATION = false;
    
    const dataSource = DEBUG_PAGINATION 
      ? duplicateReservationsForDebugging(filteredReservations)
      : filteredReservations;
    
    return Math.ceil(dataSource.length / ITEMS_PER_PAGE);
  }, [filteredReservations]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, reservationType, filterOptions]);

  // Update current reservations when page or filtered data changes
  useEffect(() => {
    let newCurrentPage = currentPage;
    if (newCurrentPage > totalPages) newCurrentPage = totalPages;
    if (newCurrentPage < 1 && totalPages > 0) newCurrentPage = 1;
    
    // Debug flag - set to true to test pagination with duplicated data
    const DEBUG_PAGINATION = true;
    
    // Use duplicated data when debugging, otherwise use filtered data
    const dataSource = DEBUG_PAGINATION 
      ? duplicateReservationsForDebugging(filteredReservations)
      : filteredReservations;
    
    const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentReservations(dataSource.slice(startIndex, endIndex));
    
    // Also update totalPages calculation based on duplicated data
    if (DEBUG_PAGINATION) {
      const debugTotalPages = Math.ceil(dataSource.length / ITEMS_PER_PAGE);
      console.log(`Debug pagination: ${dataSource.length} items, ${debugTotalPages} pages`);
    }
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

  // Add this function in your component before the return statement
  const getDateRangeText = () => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));
    
    return `${format(currentMonth, 'MMM dd')} - ${format(endOfMonth(now), 'MMM dd, yyyy')}`;
  };

  // The loading render branch
  if (!showContent) {
    console.log("Rendering loading UI");
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingAnimation}>
          <div className={styles.spinnerContainer}>
            <i className="fa-solid fa-calendar fa-beat-fade"></i>
          </div>
          <div className={styles.loadingCards}>
            <div className={`${styles.loadingCard} ${styles.loadingCard1}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard2}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard3}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard4}`}></div>
          </div>
          <div className={styles.loadingTable}>
            <div className={styles.loadingTableHeader}></div>
            <div className={styles.loadingTableRows}>
              <div className={styles.loadingTableRow}></div>
              <div className={styles.loadingTableRow}></div>
              <div className={styles.loadingTableRow}></div>
            </div>
          </div>
        </div>
        <h3 className={styles.loadingTitle}>Preparing Reservations</h3>
        <p className={styles.loadingText}>Loading your reservation data...</p>
      </div>
    );
  }

  console.log("Rendering main content with animate state:", animate);
  return (
    <div className={`${styles.container} ${animate ? styles.fadeIn : ""}`}>
      {/* STAGGERED ANIMATION: First element */}
      <div className={`${styles.topContent} ${animate ? styles.animateFirst : ""}`}>
        <ReservationTabs
          reservationType={reservationType}
          onTypeChange={setReservationType}
          onNewReservation={() => setIsNewReservationOpen(true)}
        />
        
        {/* Stats cards - animated with staggered delay */}
        <ReservationStats
          statistics={{
            checkIns: statistics.checkIns,
            checkOuts: statistics.checkOuts,
            totalGuests: statistics.totalGuests,
            occupancyRate: statistics.occupancyRate
          }}
          dateRange={getDateRangeText()}
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

      {/* STAGGERED ANIMATION: Third element - Pagination */}
      {!isLoading && !error && filteredReservations.length > 0 && totalPages > 1 && (
        <div className={`${styles.paginationContainer} ${animate ? styles.animateThird : ""}`}>
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
        onApply={(filters) => handleApplyFilters(filters as any)}
        initialFilters={filterOptions as any}
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
