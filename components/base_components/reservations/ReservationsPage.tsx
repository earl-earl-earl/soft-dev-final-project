/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "../../../components/component_styles/Reservations.module.css"; // Adjust path
import { useReservations } from "../../../src/hooks/useReservations";
import { useFilteredReservations } from "../../../src/hooks/useFilteredReservations";
import { 
  ReservationItem, 
  FilterOptions, 
  RoomOption as FilterRoomOption, 
  StatusValue 
} from "../../../src/types/reservation"; 
import { submitReservation } from "@/contexts/newReservation"
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
import FilterOverlay, { FilterOptions as OverlayFilterOptions } from "../../overlay_components/FilterOverlay";
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
  const [formSubmissionError, setFormSubmissionError] = useState<string | null>(null);

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
    if (showContent) {
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
    Object.entries(roomLookup).map(([id, roomData]) => ({ id, name: roomData.name })), 
  [roomLookup]);

  const dataForPagination = useMemo(() => filteredReservations, [filteredReservations]);
  const totalPages = useMemo(() => Math.ceil(dataForPagination.length / ITEMS_PER_PAGE), [dataForPagination]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, reservationType, filterOptions]);

  useEffect(() => {
    let targetPage = currentPage;
    if (totalPages > 0) {
      if (targetPage > totalPages) targetPage = totalPages;
      if (targetPage < 1) targetPage = 1;
    } else { targetPage = 1; }
    if (targetPage !== currentPage && totalPages > 0) { setCurrentPage(targetPage); return; }
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
      if (result.success && result.reservationId) { 
        alert(`Reservation successfully created! ID: ${result.reservationId}`);
        setIsNewReservationOpen(false); 
        setFormSubmissionError(null);  
        await refreshReservations(); 
      } else {
        setFormSubmissionError(result.message || "Failed to create reservation. Please verify details.");
      }
    } catch (submissionError: any) { 
      console.error("ReservationsPage: Unexpected error during submitReservation call:", submissionError);
      setFormSubmissionError(submissionError.message || "An unexpected application error occurred.");
    }
  };

  const handleApplyFilters = (newFilters: OverlayFilterOptions): void => { 
    // Ensure paymentStatus is cast to the correct PaymentFilterStatus type
    setFilterOptions({
      ...newFilters,
      paymentStatus: newFilters.paymentStatus as any 
    });
    setIsFilterOpen(false);
  };

  const handleRowClick = (reservation: ReservationItem) => {
    setSelectedReservation(reservation);
  };

  // --- FULLY UPDATED handleStatusChange with AVAILABILITY CHECK ---
  const handleStatusChange = async (reservationId: string, newStatus: StatusValue) => {
    console.log(`ReservationsPage: Attempting to change reservation ${reservationId} to status ${newStatus}`);

    // 1. Fetch current details of the target reservation
    const { data: targetReservation, error: fetchError } = await supabase
      .from("reservations")
      .select("source, customer_id, room_id, check_in, check_out, confirmation_time, status, payment_received") 
      .eq("id", reservationId)
      .single();

    if (fetchError || !targetReservation) {
      console.error("ReservationsPage: Failed to fetch target reservation details for status change:", fetchError?.message);
      alert("Error: Could not retrieve reservation details to update status. Please try again or check console.");
      return;
    }

    const currentStatus = targetReservation.status as StatusValue;
    const currentPaymentReceived = targetReservation.payment_received;

    // 2. AVAILABILITY CHECK (REQ-WEB-06)
    const statusesThatBlockRoomForNewBooking: StatusValue[] = ["Confirmed_Pending_Payment", "Accepted", "Checked_In"];
    
    if (
        (newStatus === "Confirmed_Pending_Payment" || newStatus === "Accepted") &&
        !statusesThatBlockRoomForNewBooking.includes(currentStatus) 
    ) {
      console.log(`ReservationsPage: Performing availability check for room ${targetReservation.room_id} (dates: ${targetReservation.check_in} to ${targetReservation.check_out}) before setting to ${newStatus}`);
      
      const { data: conflictingReservations, error: availabilityError } = await supabase
        .from('reservations')
        .select('id, status')
        .eq('room_id', targetReservation.room_id)
        .in('status', statusesThatBlockRoomForNewBooking) 
        .neq('id', reservationId) 
        .lt('check_in', targetReservation.check_out)  
        .gt('check_out', targetReservation.check_in); 

      if (availabilityError) {
        console.error("ReservationsPage: DB error during room availability check:", availabilityError.message, availabilityError.details);
        alert("Error: Could not verify room availability due to a system error. Please try again or contact support.");
        return;
      }

      if (conflictingReservations && conflictingReservations.length > 0) {
        const conflictDetails = conflictingReservations.map(r => `ID: ${r.id}(Status: ${r.status})`).join(', ');
        console.warn(`ReservationsPage: Availability conflict. Cannot change to "${newStatus}". Conflicts with: ${conflictDetails}`);
        alert(`Error: Cannot change status to "${newStatus}". The room is already booked or held by another reservation for these dates (Conflicts: ${conflictDetails}).`);
        return; 
      }
      console.log("ReservationsPage: Availability check passed for status change.");
    }

    // 3. Prepare Update Payload
    type ReservationUpdatePayload = {
      status: StatusValue;
      payment_received: boolean;
      last_updated: string;
      status_updated_at: string;
      confirmation_time?: string | null;
    };

    let newPaymentReceivedStatus = currentPaymentReceived;
    if (newStatus === "Accepted" || newStatus === "Checked_In") {
      newPaymentReceivedStatus = true;
    } else if ((newStatus === "Rejected" || newStatus === "Cancelled" || newStatus === "Expired") && 
               (currentStatus === "Pending" || currentStatus === "Confirmed_Pending_Payment")) {
      newPaymentReceivedStatus = false;
    }
    // Note: payment_received stays true if Cancelled/Rejected/NoShow from an Accepted state.

    const updatePayload: ReservationUpdatePayload = {
      status: newStatus,
      payment_received: newPaymentReceivedStatus,
      last_updated: new Date().toISOString(),
      status_updated_at: new Date().toISOString()
    };

    if ((newStatus === "Confirmed_Pending_Payment" || newStatus === "Accepted") && !targetReservation.confirmation_time) {
      updatePayload.confirmation_time = new Date().toISOString();
    } 
    // Optional: else if (!["Confirmed_Pending_Payment", "Accepted", "Checked_In"].includes(newStatus) && targetReservation.confirmation_time) {
    //   updatePayload.confirmation_time = null; 
    // }

    // 4. Perform the Update
    console.log(`ReservationsPage: Updating reservation ${reservationId} with payload:`, updatePayload);
    const { error: updateError } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", reservationId);

    if (updateError) {
      console.error("ReservationsPage: Failed to update status in DB:", updateError.message, updateError.details);
      alert(`Error: Failed to update reservation status to "${newStatus}". ${updateError.message}`);
      return;
    }
    console.log(`ReservationsPage: Reservation ${reservationId} status successfully updated to ${newStatus}.`);

    // 5. Notification (Placeholder)
    const notifyCustomerStatuses: StatusValue[] = ["Confirmed_Pending_Payment", "Accepted", "Rejected", "Expired", "Cancelled"];
    if (notifyCustomerStatuses.includes(newStatus) && (targetReservation.source === "mobile" || targetReservation.source === "staff_manual")) {
      console.log(`🔔 NOTIFICATION: Customer ${targetReservation.customer_id}, status: ${newStatus}.`);
    } else {
      console.log(`📵 No notification (Source: ${targetReservation.source}, New Status: ${newStatus})`);
    }

    await refreshReservations();
  };
  // --- END UPDATED handleStatusChange ---

  const getDateRangeText = () => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now); 
    // const lastMonthStart = startOfMonth(subMonths(now, 1)); // Not used in return
    return `${format(currentMonthStart, 'MMM dd')} - ${format(endOfMonth(now), 'MMM dd, yyyy')}`;
  };

  if (!showContent) {
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
        
        <h3 className={styles.loadingTitle}>Loading Reservations</h3>
        <p className={styles.loadingText}>Preparing reservation information...</p>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${animate ? styles.fadeIn : ""}`}>
      <div className={`${styles.topContent} ${animate ? styles.animateFirst : ""}`}>
        <ReservationTabs
          reservationType={reservationType}
          onTypeChange={setReservationType}
          onNewReservation={openNewReservationModal} 
        />
        <ReservationStats statistics={statistics} animate={animate} />
        <div className={styles.reservationListSection}>
          <ReservationFilters
            statusFilter={statusFilter} onStatusFilterChange={setStatusFilter}
            searchTerm={searchTerm} onSearchTermChange={setSearchTerm}
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