/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from "react"; // Added useCallback
import styles from "../../../components/component_styles/Reservations.module.css";
import { useReservations } from "../../../src/hooks/useReservations";
import { useFilteredReservations } from "../../../src/hooks/useFilteredReservations";
import { 
  ReservationItem, 
  FilterOptions, 
  RoomOption as FilterRoomOption 
} from "../../../src/types/reservation";
import { submitReservation } from "@/contexts/newReservation"; 
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Import Components
import ReservationTable from "./ReservationTable";
import ReservationTabs from "./ReservationTabs";
import ReservationStats from "./ReservationStats";
import ReservationFilters from "./ReservationFilters";
import Pagination from "../../common/Pagination";
// Import NewReservationOverlay and ITS RoomOption type specifically
import NewReservationOverlay, { 
  ReservationData, 
  RoomOption as NewReservationOverlayRoomOption 
} from "../../overlay_components/NewReservationOverlay"; 
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

  // Debugging function (can be removed for production)
  const duplicateReservationsForDebugging = useCallback((
    inputReservations: ReservationItem[], 
    duplicateCount: number = 1
  ): ReservationItem[] => {
    if (!inputReservations || !inputReservations.length) return [];
    const duplicatedData: ReservationItem[] = [];
    for (let i = 0; i < duplicateCount; i++) {
      inputReservations.forEach(reservation => {
        duplicatedData.push({
          ...reservation,
          id: `${reservation.id}-dup-${i}`
        });
      });
    }
    return duplicatedData;
  }, []);


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
  
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  // State for rooms passed to NewReservationOverlay, correctly typed
  const [availableRoomsForNewOverlay, setAvailableRoomsForNewOverlay] = useState<NewReservationOverlayRoomOption[]>([]);
  const [formSubmissionError, setFormSubmissionError] = useState<string | null>(null); // For NewReservationOverlay errors

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);

  const [animate, setAnimate] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Initial content visibility and animation trigger
  useEffect(() => {
    if (!isLoading) {
      const showTimer = setTimeout(() => {
        setShowContent(true);
        const animateTimer = setTimeout(() => setAnimate(true), 50); 
        return () => clearTimeout(animateTimer);
      }, 100);
      return () => clearTimeout(showTimer);
    } else {
      setShowContent(false);
      setAnimate(false);
    }
  }, [isLoading]);

  // Re-trigger animation on filter/page changes
  useEffect(() => {
    if (showContent) { // Only if content is already visible
      setAnimate(false);
      const timer = setTimeout(() => setAnimate(true), 50); 
      return () => clearTimeout(timer);
    }
  }, [reservationType, currentPage, searchTerm, statusFilter, filterOptions, showContent]);


  // Fetch rooms for NewReservationOverlay
  useEffect(() => {
    const fetchRoomsForNewOverlay = async () => {
      try {
        const { data: allRawRooms, error: fetchError } = await supabase
          .from('rooms')
          .select('id, name, room_price, capacity, is_active')
          .eq('is_active', true); 
        
        if (fetchError) {
          console.error("ReservationsPage: Error fetching rooms for NewResOverlay:", fetchError.message);
          setAvailableRoomsForNewOverlay([]); return;
        }
        if (allRawRooms) {
          const formattedRoomOptions: NewReservationOverlayRoomOption[] = allRawRooms.map(room => ({
            id: String(room.id), name: String(room.name),
            price: Number(room.room_price || 0), capacity: Number(room.capacity || 0) 
          }));
          console.log("ReservationsPage: Rooms for NewReservationOverlay dropdown:", formattedRoomOptions);
          setAvailableRoomsForNewOverlay(formattedRoomOptions);
        } else {
          console.log("ReservationsPage: No active rooms found for NewReservationOverlay.");
          setAvailableRoomsForNewOverlay([]);
        }
      } catch (err) {
        console.error("ReservationsPage: Failed to fetch/process rooms for NewReservationOverlay:", err);
        setAvailableRoomsForNewOverlay([]);
      }
    };
    fetchRoomsForNewOverlay();
  }, []);

  // Prepare roomOptions for FilterOverlay
  const roomOptionsForFilter: FilterRoomOption[] = useMemo(() => 
    Object.entries(roomLookup).map(([id, roomData]) => ({
      id, name: roomData.name,
    })), [roomLookup]);

  // Pagination
  const dataForPagination = useMemo(() => {
    // const DEBUG_PAGINATION = false; // Toggle for debugging
    // return DEBUG_PAGINATION ? duplicateReservationsForDebugging(filteredReservations) : filteredReservations;
    return filteredReservations; // Usually use the direct filtered list
  }, [filteredReservations/*, duplicateReservationsForDebugging*/]);


  const totalPages = useMemo(() => Math.ceil(dataForPagination.length / ITEMS_PER_PAGE), [dataForPagination]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, reservationType, filterOptions]);

  useEffect(() => {
    let targetPage = currentPage;
    if (totalPages > 0) {
      if (targetPage > totalPages) targetPage = totalPages;
      if (targetPage < 1) targetPage = 1;
    } else {
      targetPage = 1; 
    }
    if (targetPage !== currentPage && totalPages > 0) {
      setCurrentPage(targetPage); 
      return; 
    }
    const startIndex = (targetPage - 1) * ITEMS_PER_PAGE;
    setCurrentReservations(dataForPagination.slice(startIndex, startIndex + ITEMS_PER_PAGE));
  }, [currentPage, dataForPagination, totalPages]);


  const openNewReservationModal = () => {
    setFormSubmissionError(null); 
    setIsNewReservationOpen(true);
  };

  const handleCloseNewReservationModal = () => {
    setIsNewReservationOpen(false);
    setFormSubmissionError(null); 
  };

  const handleNewReservation = async (reservationData: ReservationData) => {
    setFormSubmissionError(null); 
    try {
      const result = await submitReservation(reservationData);
      if (result.success) {
        alert(`Reservation successfully created! ID: ${result.reservationId}`); // Keep alert for success confirmation
        setIsNewReservationOpen(false); 
        setFormSubmissionError(null);  
        await refreshReservations(); 
      } else {
        // Set the error message to be displayed in the NewReservationOverlay
        setFormSubmissionError(result.message || "Failed to create reservation. Please check the details and try again.");
      }
    } catch (submissionError: any) { 
      console.error("ReservationsPage: Error submitting reservation:", submissionError);
      setFormSubmissionError(submissionError.message || "An unexpected application error occurred while creating the reservation.");
    }
  };

  const handleApplyFilters = (newFilters: FilterOptions): void => {
    setFilterOptions(newFilters);
    setIsFilterOpen(false);
  };

  const handleRowClick = (reservation: ReservationItem) => {
    setSelectedReservation(reservation);
  };

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    // calls refreshReservations() on success.
    const { data: reservationDetails, error: fetchError } = await supabase
      .from("reservations").select("source, customer_id, confirmation_time").eq("id", reservationId).single();
    if (fetchError || !reservationDetails) { /* ... */ return; }
    const updatePayload: any = { status: newStatus, payment_received: newStatus === "Accepted", last_updated: new Date().toISOString(), status_updated_at: new Date().toISOString() };
    if ((newStatus === "Confirmed_Pending_Payment" || newStatus === "Accepted") && !reservationDetails.confirmation_time) {
      updatePayload.confirmation_time = new Date().toISOString();
    } else if (newStatus !== "Confirmed_Pending_Payment" && newStatus !== "Accepted") {
    }


    const { error: updateError } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", reservationId);

    if (updateError) {
      console.error("Failed to update status in DB:", updateError.message);
      alert("Failed to update reservation status.");
      return;
    }

    // 'mobile' is the source string for mobile app bookings
    if (reservationDetails.source === "mobile") { 
      console.log("🔔 Would send notification to customer:", reservationDetails.customer_id);
      // TODO: Integrate Firebase push notification logic here.
    } else {
      console.log(`📵 No notification sent (source is ${reservationDetails.source})`);
    }

    await refreshReservations(); 
  };

  const getDateRangeText = () => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now); 
    // const lastMonthStart = startOfMonth(subMonths(now, 1)); // Not used in return
    return `${format(currentMonthStart, 'MMM dd')} - ${format(endOfMonth(now), 'MMM dd, yyyy')}`;
  };

  if (!showContent) {
    return (
        <div className={styles.loadingContainer}>
          {/* ... loading elements ... */}
          <h3 className={styles.loadingTitle}>Preparing Reservations</h3>
          <p className={styles.loadingText}>Loading your reservation data...</p>
        </div>
      );
  }

  return (
    <div className={`${styles.container} ${animate ? styles.fadeIn : ""}`}>
      <div className={`${styles.topContent} ${animate ? styles.animateFirst : ""}`}>
        <ReservationTabs
          reservationType={reservationType}
          onTypeChange={setReservationType}
          onNewReservation={() => setIsNewReservationOpen(true)}
        />
        
        <ReservationStats
          statistics={statistics} 
          // dateRange={getDateRangeText()} // Pass if ReservationStats uses it
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

          <div className={`${animate ? styles.animateSecond : ""}`}>
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
              animate={animate} 
            />
          </div>
        </div>
      </div>

      {!isLoading && !error && dataForPagination.length > 0 && totalPages > 1 && (
        <div className={`${styles.paginationContainer} ${animate ? styles.animateThird : ""}`}>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      <NewReservationOverlay
        isOpen={isNewReservationOpen}
        onClose={handleCloseNewReservationModal} 
        onSubmit={handleNewReservation}
        availableRooms={availableRoomsForNewOverlay} 
        submissionError={formSubmissionError} 
      />

      <FilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters} 
        initialFilters={filterOptions} 
        roomOptions={roomOptionsForFilter} 
      />

      <ExportOverlay
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={(exportData) => console.log("Export data:", exportData)} 
      />

      {selectedReservation && (
        <ReservationDetailsOverlay
          isOpen={true} // selectedReservation being non-null implies isOpen=true
          onClose={() => setSelectedReservation(null)}
          reservation={selectedReservation}
          customerLookup={customerLookup}
          roomLookup={roomLookup}
          staffLookup={staffLookup}
        />
      )}
    </div>
  );
};

export default ReservationsPage;