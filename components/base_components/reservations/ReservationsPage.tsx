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
import NewReservationOverlay, { 
  ReservationData, 
  RoomOption as NewReservationOverlayRoomOption 
} from "../../overlay_components/NewReservationOverlay";
import FilterOverlay, { FilterOptions as OverlayFilterOptions } from "../../overlay_components/FilterOverlay";
import ExportOverlay from "../../overlay_components/ExportOverlay"; // Ensure this component exists and accepts onExport
import ReservationDetailsOverlay from "../../overlay_components/ReservationDetailsOverlay";
import { supabase } from "@/lib/supabaseClient"; 

// ***** ADD IMPORTS FOR EXPORT UTILITIES *****
import { 
    getStatusDisplay, 
    calculateTotalGuests 
    // You can import other utilities like statusDescriptions or getStatusCategory if needed
} from "../../../src/utils/reservationUtils"; // Adjust path as needed if different

const ITEMS_PER_PAGE = 6;


// ***** HELPER FUNCTION TO CONVERT DATA TO CSV STRING *****
const convertToCSV = (data: Record<string, any>[], headers?: string[]): string => {
  const array = [Object.keys(data[0])].concat(data as any); // Use keys from first object as headers if not provided

  if (headers) { // If explicit headers are provided, use them
    array[0] = headers;
  }

  return array.map(row => {
    return Object.values(row).map(value => {
      const cellValue = value === null || value === undefined ? '' : String(value);
      // Escape commas, quotes, and newlines in cell values
      const escapedCellValue = cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n') 
        ? `"${cellValue.replace(/"/g, '""')}"` 
        : cellValue;
      return escapedCellValue;
    }).join(',');
  }).join('\r\n');
};

// ***** HELPER FUNCTION TO TRIGGER FILE DOWNLOAD *****
const downloadFile = (content: string, fileName: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};


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
    filteredReservations, // This will be used for export
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
  const [availableRoomsForNewOverlay, setAvailableRoomsForNewOverlay] = useState<NewReservationOverlayRoomOption[]>([]);
  const [formSubmissionError, setFormSubmissionError] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);

  const [animate, setAnimate] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [viewedReservations, setViewedReservations] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (showContent) {
      setAnimate(false);
      const timer = setTimeout(() => setAnimate(true), 50); 
      return () => clearTimeout(timer);
    }
  }, [reservationType, currentPage, searchTerm, statusFilter, filterOptions, showContent]);

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
          setAvailableRoomsForNewOverlay(formattedRoomOptions);
        } else {
          setAvailableRoomsForNewOverlay([]);
        }
      } catch (err) {
        console.error("ReservationsPage: Failed to fetch/process rooms for NewReservationOverlay:", err);
        setAvailableRoomsForNewOverlay([]);
      }
    };
    fetchRoomsForNewOverlay();
  }, []);

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
    setFilterOptions({
      ...newFilters,
      paymentStatus: newFilters.paymentStatus as any 
    });
    setIsFilterOpen(false);
  };

  const handleRowClick = (reservation: ReservationItem) => {
    setViewedReservations(prev => {
      const newSet = new Set(prev);
      newSet.add(reservation.id);
      return newSet;
    });
    setSelectedReservation(reservation);
  };

  const handleStatusChange = async (reservationId: string, newStatus: StatusValue) => {
    const { data: targetReservation, error: fetchError } = await supabase
      .from("reservations")
      .select("source, customer_id, room_id, check_in, check_out, confirmation_time, status, payment_received") 
      .eq("id", reservationId)
      .single();

    if (fetchError || !targetReservation) {
      alert("Error: Could not retrieve reservation details to update status.");
      return;
    }

    const currentStatus = targetReservation.status as StatusValue;
    const statusesThatBlockRoomForNewBooking: StatusValue[] = ["Confirmed_Pending_Payment", "Accepted", "Checked_In"];
    
    if (
        (newStatus === "Confirmed_Pending_Payment" || newStatus === "Accepted") &&
        !statusesThatBlockRoomForNewBooking.includes(currentStatus) 
    ) {
      const { data: conflictingReservations, error: availabilityError } = await supabase
        .from('reservations')
        .select('id, status')
        .eq('room_id', targetReservation.room_id)
        .in('status', statusesThatBlockRoomForNewBooking) 
        .neq('id', reservationId) 
        .lt('check_in', targetReservation.check_out)  
        .gt('check_out', targetReservation.check_in); 

      if (availabilityError) {
        alert("Error: Could not verify room availability.");
        return;
      }
      if (conflictingReservations && conflictingReservations.length > 0) {
        const conflictDetails = conflictingReservations.map(r => `ID: ${r.id}(Status: ${r.status})`).join(', ');
        alert(`Error: Cannot change status to "${newStatus}". Room conflict: ${conflictDetails}.`);
        return; 
      }
    }

    type ReservationUpdatePayload = {
      status: StatusValue;
      payment_received: boolean;
      last_updated: string;
      status_updated_at: string;
      confirmation_time?: string | null;
    };

    let newPaymentReceivedStatus = targetReservation.payment_received;
    if (newStatus === "Accepted" || newStatus === "Checked_In") {
      newPaymentReceivedStatus = true;
    } else if ((newStatus === "Rejected" || newStatus === "Cancelled" || newStatus === "Expired") && 
               (currentStatus === "Pending" || currentStatus === "Confirmed_Pending_Payment")) {
      newPaymentReceivedStatus = false;
    }

    const updatePayload: ReservationUpdatePayload = {
      status: newStatus,
      payment_received: newPaymentReceivedStatus,
      last_updated: new Date().toISOString(),
      status_updated_at: new Date().toISOString()
    };

    if ((newStatus === "Confirmed_Pending_Payment" || newStatus === "Accepted") && !targetReservation.confirmation_time) {
      updatePayload.confirmation_time = new Date().toISOString();
    } 

    const { error: updateError } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", reservationId);

    if (updateError) {
      alert(`Error: Failed to update reservation status to "${newStatus}". ${updateError.message}`);
      return;
    }

    const notifyCustomerStatuses: StatusValue[] = ["Confirmed_Pending_Payment", "Accepted", "Rejected", "Expired", "Cancelled"];
    if (notifyCustomerStatuses.includes(newStatus) && (targetReservation.source === "mobile" || targetReservation.source === "staff_manual")) {
      console.log(`🔔 NOTIFICATION: Customer ${targetReservation.customer_id}, status: ${newStatus}.`);
    }
    await refreshReservations();
  };

  useEffect(() => {
    try {
      const savedViewedReservations = localStorage.getItem('viewedReservations');
      if (savedViewedReservations) {
        setViewedReservations(new Set(JSON.parse(savedViewedReservations)));
      }
    } catch (e) { console.error('Failed to load viewed reservations from localStorage:', e); }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('viewedReservations', JSON.stringify([...viewedReservations]));
    } catch (e) { console.error('Failed to save viewed reservations to localStorage:', e); }
  }, [viewedReservations]);

  const handleDeleteReservation = async (reservationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { alert('You must be logged in to delete.'); return; }
      const accessToken = session.access_token;
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', },
      });
      const result = await res.json();
      if (!res.ok) { alert(result.error || 'Failed to delete reservation.'); return; }
      alert('Reservation deleted successfully.');
      setSelectedReservation(null);
      await refreshReservations();
    } catch (err: any) { alert('Failed to delete reservation.'); console.error('Delete reservation error:', err); }
  };

  // ***** FUNCTION TO HANDLE THE ACTUAL EXPORT PROCESS *****
  const handleConfirmExport = (exportOptions?: any) => { // exportOptions can come from ExportOverlay
    console.log("Exporting data with options:", exportOptions); // Log options if any

    if (!filteredReservations || filteredReservations.length === 0) {
      alert("No data available to export for the current filters.");
      setIsExportOpen(false);
      return;
    }

    try {
      // 1. Format the data using utility functions
      const formattedDataForExport = filteredReservations.map(res => {
        const customerName = customerLookup[res.customerId]?.name || 'N/A';
        const roomName = roomLookup[res.roomId]?.name || 'N/A';
        const staffName = res.auditedBy ? (staffLookup[res.auditedBy]?.name || 'System') : 'N/A';
        
        return {
          'ID': res.id,
          'Guest Name': customerName,
          'Room': roomName,
          'Check-In': res.checkIn? format(new Date(res.checkIn), 'yyyy-MM-dd HH:mm') : 'N/A',
          'Check-Out': res.checkOut ? format(new Date(res.checkOut), 'yyyy-MM-dd HH:mm') : 'N/A',
          'Status': getStatusDisplay(res.status), // Using utility function
          'Total Guests': calculateTotalGuests(res.guests), // Using utility function
          'Adults': res.guests.adults,
          'Children': res.guests.children,
          'Seniors': res.guests.seniors,
          'Total Amount': res.totalPrice?.toFixed(2) || '0.00',
          'Payment Method': res.type?  "online" : "direct" ,
          'Payment Received': res.paymentReceived ? 'Yes' : 'No',
          'Created At': res.timestamp ? format(new Date(res.timestamp), 'yyyy-MM-dd HH:mm') : 'N/A',
          'Confirmation Time': res.confirmationTime ? format(new Date(res.confirmationTime), 'yyyy-MM-dd HH:mm') : 'N/A',
          'Processed By': staffName,
          'Source': res.source || 'N/A',
        };
      });

      // Define custom headers in the desired order
      const customHeaders = [
        'ID', 'Guest Name', 'Room', 'Check-In', 'Check-Out', 'Status', 
        'Total Guests', 'Adults', 'Children', 'Seniors', 'Total Amount', 
        'Payment Method', 'Payment Receieved', 'Created At', 'Confirmation Time',
        'Processed By', 'Source'
      ];

      // 2. Convert to CSV
      const csvString = convertToCSV(formattedDataForExport, customHeaders);

      // 3. Trigger download
      const fileName = `reservations_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      downloadFile(csvString, fileName, 'text/csv;charset=utf-8;');

      console.log("Data export successful.");
    } catch (err) {
      console.error("Error during data export:", err);
      alert("An error occurred while exporting data. Please check the console for details.");
    }

    setIsExportOpen(false); // Close the overlay after export
  };


  if (!showContent) {
    // ... (loading UI remains the same)
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
            onOpenExport={() => setIsExportOpen(true)} // This opens the ExportOverlay
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
              viewedReservations={viewedReservations}
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

      {/* ***** PASS THE EXPORT HANDLER TO ExportOverlay ***** */}
      <ExportOverlay
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleConfirmExport} // Pass the actual export function here
      />

      {selectedReservation && (
        <ReservationDetailsOverlay
          isOpen={true}
          onClose={() => setSelectedReservation(null)}
          reservation={selectedReservation}
          customerLookup={customerLookup}
          roomLookup={roomLookup}
          staffLookup={staffLookup}
          handleDeleteReservation={handleDeleteReservation}
        />
      )}
    </div>
  );
};

export default ReservationsPage;