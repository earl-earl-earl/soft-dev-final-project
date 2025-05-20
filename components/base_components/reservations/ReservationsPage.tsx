/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react"; // Removed useRef as it's not used
import styles from "../../../components/component_styles/Reservations.module.css";
import { useReservations } from "../../../src/hooks/useReservations";
import { useFilteredReservations } from "../../../src/hooks/useFilteredReservations";
import { 
  ReservationItem, 
  FilterOptions, 
  RoomOption as FilterRoomOption // Alias for RoomOption used in FilterOverlay
} from "../../../src/types/reservation"; // Assuming RoomOption here is for FilterOverlay
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
  RoomOption as NewReservationOverlayRoomOption // Specific type for NewReservationOverlay's prop
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
    roomLookup, // This roomLookup is { [id: string]: { name: string, price?: number } }
    isLoading,
    error,
    refreshReservations
  } = useReservations();

  const duplicateReservationsForDebugging = (
    inputReservations: ReservationItem[], // Renamed to avoid conflict
    duplicateCount: number = 5
  ): ReservationItem[] => {
    if (!inputReservations.length) return [];
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
    reservations, // Pass the original reservations from useReservations
    customerLookup,
    roomLookup 
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [currentReservations, setCurrentReservations] = useState<ReservationItem[]>([]);
  
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  // State for rooms passed to NewReservationOverlay, correctly typed
  const [availableRoomsForNewOverlay, setAvailableRoomsForNewOverlay] = useState<NewReservationOverlayRoomOption[]>([]);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);

  const [animate, setAnimate] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setShowContent(true);
        setTimeout(() => setAnimate(true), 200);
      }, 400);
    }
  }, [isLoading]);

  useEffect(() => {
    if (showContent) {
      setAnimate(false);
      const timer = setTimeout(() => setAnimate(true), 50); // Quick reset for re-animation
      return () => clearTimeout(timer);
    }
  }, [reservationType, currentPage, searchTerm, statusFilter, filterOptions, showContent]); // Re-animate on filter/page changes


  // Fetch and prepare rooms specifically for the NewReservationOverlay
  useEffect(() => {
    const fetchRoomsForNewOverlay = async () => {
      try {
        const { data: allRawRooms, error: fetchError } = await supabase
          .from('rooms')
          .select('id, name, room_price, is_active') // Ensure room_price is selected
          .eq('is_active', true); 
        
        if (fetchError) {
          console.error("ReservationsPage: Error fetching rooms for NewReservationOverlay:", fetchError);
          setAvailableRoomsForNewOverlay([]);
          return;
        }
        
        if (allRawRooms && allRawRooms.length > 0) {
          const formattedRoomOptions: NewReservationOverlayRoomOption[] = allRawRooms.map(room => ({
            id: String(room.id),
            name: String(room.name),
            price: Number(room.room_price || 0) // Default price to 0 if null/undefined
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
  }, []); // Run once when component mounts

  // Prepare roomOptions for FilterOverlay (uses FilterRoomOption type)
  // This uses the roomLookup from useReservations
  const roomOptionsForFilter: FilterRoomOption[] = useMemo(() => 
    Object.entries(roomLookup).map(([id, roomData]) => ({
      id,
      name: roomData.name,
      // price: roomData.price // FilterRoomOption doesn't have price in your types/reservation.ts
    })), [roomLookup]);


  const totalPages = useMemo(() => { // Corrected use of useMemo
    // const DEBUG_PAGINATION = false; // Set to true for debugging
    // const dataSource = DEBUG_PAGINATION 
    //   ? duplicateReservationsForDebugging(filteredReservations) 
    //   : filteredReservations;
    // Using filteredReservations directly is usually what you want
    return Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
  }, [filteredReservations/*, duplicateReservationsForDebugging*/]); // Remove duplicateReservationsForDebugging if not used in final logic

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, reservationType, filterOptions]);

  useEffect(() => {
    let newCurrentPage = currentPage;
    // Ensure currentPage is within valid bounds
    if (totalPages > 0) {
        if (newCurrentPage > totalPages) newCurrentPage = totalPages;
        if (newCurrentPage < 1) newCurrentPage = 1;
    } else { // No pages if no items
        newCurrentPage = 1; 
    }
    // If currentPage was adjusted, update the state, otherwise proceed
    if (newCurrentPage !== currentPage && totalPages > 0) { // only update if it changed and there are pages
        setCurrentPage(newCurrentPage); 
        // The update to currentReservations will happen in the next render cycle due to currentPage change
        return; 
    }
    
    // const DEBUG_PAGINATION = false; // Set to true for debugging
    // const dataSource = DEBUG_PAGINATION 
    //   ? duplicateReservationsForDebugging(filteredReservations) 
    //   : filteredReservations;
    // Using filteredReservations directly
    const dataSource = filteredReservations;

    const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentReservations(dataSource.slice(startIndex, endIndex));
    
  }, [currentPage, filteredReservations, totalPages]);

  const handleNewReservation = async (reservationData: ReservationData) => {
    try {
      const result = await submitReservation(reservationData);
      if (result.success) {
        alert("Reservation successfully created!");
        setIsNewReservationOpen(false);
        await refreshReservations(); // Refresh the main reservations list
      } else {
        alert("Failed to create reservation: " + (result.message || "Unknown error"));
      }
    } catch (submissionError) { // Changed variable name
      alert("An error occurred while creating the reservation.");
      console.error("Error submitting reservation:", submissionError);
    }
  };

  const handleApplyFilters = (newFilters: FilterOptions): void => { // Renamed variable
    setFilterOptions(newFilters);
    setIsFilterOpen(false);
  };

  const handleRowClick = (reservation: ReservationItem) => {
    setSelectedReservation(reservation);
  };

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    // ... (your existing handleStatusChange logic - seems okay)
    const { data: reservationDetails, error: fetchError } = await supabase // Renamed
      .from("reservations")
      .select("source, customer_id, room_id, check_in, check_out, confirmation_time")
      .eq("id", reservationId)
      .single();

    if (fetchError || !reservationDetails) {
      console.error("Failed to fetch reservation details for status change:", fetchError?.message);
      alert("Unable to update reservation status. Could not fetch details.");
      return;
    }

    const updatePayload: any = {
      status: newStatus,
      payment_received: newStatus === "Accepted", // Assuming "Accepted" means paid
      last_updated: new Date().toISOString(),
      status_updated_at: new Date().toISOString()
    };

    if (newStatus === "Confirmed_Pending_Payment" && !reservationDetails.confirmation_time) {
      updatePayload.confirmation_time = new Date().toISOString();
    } else if (newStatus === "Accepted" && !reservationDetails.confirmation_time) {
      updatePayload.confirmation_time = new Date().toISOString();
    } else if (newStatus !== "Confirmed_Pending_Payment" && newStatus !== "Accepted") {
      // Reset confirmation_time if status moves away from confirmed/accepted states
      // This depends on your business logic for what other statuses mean for confirmation_time
      // updatePayload.confirmation_time = null; 
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

    // Assuming 'mobile_app' is the source string for mobile app bookings
    if (reservationDetails.source === "mobile_app") { 
      console.log("🔔 Would send notification to customer:", reservationDetails.customer_id);
      // TODO: Integrate Firebase push notification logic here.
    } else {
      console.log(`📵 No notification sent (source is ${reservationDetails.source})`);
    }

    await refreshReservations(); // Refresh data after successful update
  };

  const getDateRangeText = () => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now); // Renamed
    // const lastMonthStart = startOfMonth(subMonths(now, 1)); // Not used in return
    return `${format(currentMonthStart, 'MMM dd')} - ${format(endOfMonth(now), 'MMM dd, yyyy')}`;
  };

  if (!showContent) {
    // ... (your loading UI - seems okay) ...
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
          statistics={{
            checkIns: statistics.checkIns,
            checkOuts: statistics.checkOuts,
            totalGuests: statistics.totalGuests,
            occupancyRate: statistics.occupancyRate
          }}
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
              onStatusChange={handleStatusChange} // Pass the corrected handleStatusChange
              isLoading={isLoading} // Pass isLoading for table's own loading state if needed
              error={error}
              onRetry={refreshReservations}
              animate={animate} // Pass animate for table row animations
            />
          </div>
        </div>
      </div>

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
        availableRooms={availableRoomsForNewOverlay} // Use the correctly typed and populated state
      />

      <FilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters} // Removed 'as any'
        initialFilters={filterOptions} // Removed 'as any'
        roomOptions={roomOptionsForFilter} // Pass the correctly prepared roomOptions
      />

      <ExportOverlay
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={(data) => console.log("Export data:", data)} // data type can be more specific
      />

      {selectedReservation && ( // Conditionally render to ensure selectedReservation is not null
        <ReservationDetailsOverlay
          isOpen={selectedReservation !== null}
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