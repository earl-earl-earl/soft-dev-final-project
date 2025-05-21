// src/hooks/useFilteredReservations.ts

import { useState, useMemo } from "react";
import { 
  ReservationItem, 
  ReservationType, 
  FilterOptions, 
  CustomerLookup, 
  RoomLookup,
  StatusValue, // Import StatusValue type
  // PaymentStatusValue
} from "../types/reservation"; 
import { getStatusCategory } from "../utils/reservationUtils";
import { endOfMonth, startOfMonth } from "date-fns";

interface UseFilteredReservationsProps {
  reservations: ReservationItem[];
  customerLookup: CustomerLookup;
  roomLookup: RoomLookup;
}

// Define possible values for the paymentStatus filter
type PaymentFilterStatus = 'all' | 'Payment Pending' | 'Awaiting Downpayment' | 'Downpayment Paid' | 'Fully Paid' | 'Not Applicable' | 'Rejected – No Payment Recorded';

interface UseFilteredReservationsReturn {
  filteredReservations: ReservationItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string; // Can be 'all' or a StatusValue or a status category string
  setStatusFilter: (status: string) => void;
  reservationType: ReservationType;
  setReservationType: (type: ReservationType) => void;
  filterOptions: FilterOptions & { paymentStatus: PaymentFilterStatus }; 
  setFilterOptions: (options: FilterOptions & { paymentStatus: PaymentFilterStatus }) => void;
  statistics: {
    checkIns: number;
    checkOuts: number;
    totalGuests: number;
    occupancyRate: number;
  };
}

// Helper to derive payment status text based on reservation status (mirroring ReservationTable)
// Code is redundant, should be in reservation.ts (but di ko kabalo kung ano na files ang ma apektohan)
const derivePaymentStatusText = (reservationStatus: StatusValue): PaymentFilterStatus => {
  switch (reservationStatus) {
    case "Pending": return "Payment Pending";
    case "Confirmed_Pending_Payment": return "Awaiting Downpayment";
    case "Accepted": return "Downpayment Paid";
    case "Checked_In": return "Fully Paid";
    case "Checked_Out": return "Fully Paid";
    case "No_Show": return "Downpayment Paid"; 
    case "Expired": return "Not Applicable";
    case "Cancelled": return "Not Applicable";
    case "Rejected": return "Rejected – No Payment Recorded";
    default:
      // This should not be reached if reservationStatus is always a valid StatusValue
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = reservationStatus;
      return 'all'; // Fallback, though ideally every status maps
  }
};


export const useFilteredReservations = ({
  reservations,
  customerLookup,
  roomLookup
}: UseFilteredReservationsProps): UseFilteredReservationsReturn => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); 
  const [reservationType, setReservationType] = useState<ReservationType>("all");
  
  // Update FilterOptions to use the more specific PaymentFilterStatus
  const [filterOptions, setFilterOptions] = useState<FilterOptions & { paymentStatus: PaymentFilterStatus }>({
    checkInStart: '',
    checkInEnd: '',
    checkOutStart: '',
    checkOutEnd: '',
    paymentStatus: 'all', 
    minGuests: '',
    maxGuests: '',
    roomId: 'all'
  });

  const filteredReservations = useMemo(() => {
    let reservationsList = [...reservations]; // Create a new array to avoid mutating the prop
    
    // Filter by reservation type (direct/online)
    if (reservationType !== "all") {
      reservationsList = reservationsList.filter(reservation => reservation.type === reservationType);
    }
    
    // Filter by status (using getStatusCategory or direct status match)
    if (statusFilter !== "all") {
      reservationsList = reservationsList.filter(
        (reservation) => {
          // Allow filtering by exact status or by category
          const itemStatus = reservation.status as StatusValue;
          return getStatusCategory(itemStatus) === statusFilter || itemStatus === statusFilter;
        }
      );
    }
    
    // Apply advanced filters from filterOptions
    if (filterOptions.checkInStart) {
      try {
        const startDate = new Date(filterOptions.checkInStart);
        if (!isNaN(startDate.getTime())) {
          reservationsList = reservationsList.filter(r => r.checkIn && new Date(r.checkIn).setHours(0,0,0,0) >= startDate.setHours(0,0,0,0));
        }
      } catch (e) { console.error("Invalid checkInStart date for filtering", e); }
    }
    
    if (filterOptions.checkInEnd) {
      try {
        const endDate = new Date(filterOptions.checkInEnd);
        if (!isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999); 
          reservationsList = reservationsList.filter(r => r.checkIn && new Date(r.checkIn) <= endDate);
        }
      } catch (e) { console.error("Invalid checkInEnd date for filtering", e); }
    }
    
    if (filterOptions.checkOutStart) {
      try {
        const startDate = new Date(filterOptions.checkOutStart);
         if (!isNaN(startDate.getTime())) {
            reservationsList = reservationsList.filter(r => r.checkOut && new Date(r.checkOut).setHours(0,0,0,0) >= startDate.setHours(0,0,0,0));
         }
      } catch (e) { console.error("Invalid checkOutStart date for filtering", e); }
    }
    
    if (filterOptions.checkOutEnd) {
      try {
        const endDate = new Date(filterOptions.checkOutEnd);
        if (!isNaN(endDate.getTime())) {
            endDate.setHours(23, 59, 59, 999);
            reservationsList = reservationsList.filter(r => r.checkOut && new Date(r.checkOut) <= endDate);
        }
      } catch (e) { console.error("Invalid checkOutEnd date for filtering", e); }
    }
    
    // --- UPDATED PAYMENT STATUS FILTER ---
    if (filterOptions.paymentStatus !== 'all') {
      reservationsList = reservationsList.filter(r => {
        const derivedPaymentText = derivePaymentStatusText(r.status as StatusValue);
        return derivedPaymentText === filterOptions.paymentStatus;
      });
    }
    // --- END UPDATED PAYMENT STATUS FILTER ---
    
    if (filterOptions.minGuests) {
      const min = parseInt(filterOptions.minGuests, 10); 
      if (!isNaN(min) && min > 0) {
        reservationsList = reservationsList.filter(r => 
          (r.guests.adults + r.guests.children + r.guests.seniors) >= min
        );
      }
    }
    
    if (filterOptions.maxGuests) {
      const max = parseInt(filterOptions.maxGuests, 10); 
      if (!isNaN(max) && max > 0) {
        reservationsList = reservationsList.filter(r => 
          (r.guests.adults + r.guests.children + r.guests.seniors) <= max
        );
      }
    }
    
    if (filterOptions.roomId && filterOptions.roomId !== 'all') { // Check if roomId is not empty
      reservationsList = reservationsList.filter(r => r.roomId === filterOptions.roomId);
    }
    
    // Search filter (applied last)
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase().replace(/\s+/g, ""); // Remove spaces from search term for phone match
      reservationsList = reservationsList.filter((reservation) => {
        const customer = reservation.customerId ? customerLookup[String(reservation.customerId)] : null;
        const room = reservation.roomId ? roomLookup[String(reservation.roomId)] : null;
        
        const customerName = customer?.name || "";
        const customerPhone = customer?.phone?.replace(/\s+/g, "") || ""; // Remove spaces from phone for match
        const roomName = room?.name || "";
        const itemStatus = reservation.status as StatusValue;
        const statusCategoryDisplay = getStatusCategory(itemStatus).toLowerCase();
        const statusDisplay = itemStatus.toLowerCase().replace(/_/g, " ");

        return (
          reservation.id.toLowerCase().includes(lowerSearchTerm) ||
          customerName.toLowerCase().includes(lowerSearchTerm) ||
          customerPhone.includes(lowerSearchTerm) || 
          roomName.toLowerCase().includes(lowerSearchTerm) ||
          (reservation.customerId && String(reservation.customerId).toLowerCase().includes(lowerSearchTerm)) ||
          (reservation.roomId && String(reservation.roomId).toLowerCase().includes(lowerSearchTerm)) ||
          statusDisplay.includes(lowerSearchTerm) ||
          statusCategoryDisplay.includes(lowerSearchTerm)
        );
      });
    }
    return reservationsList;
  }, [reservations, searchTerm, statusFilter, reservationType, filterOptions, customerLookup, roomLookup]);

  // Calculate statistics based on the *original, unfiltered* reservations for a fixed period,
  const statistics = useMemo(() => {
    const today = new Date();
    const startDate = startOfMonth(today); 
    const endDate = endOfMonth(today);
    endDate.setHours(23, 59, 59, 999); 

    // console.log(`Calculating stats for period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    let statsSourceReservations = [...reservations]; // Use a copy of the original full list
    if (reservationType !== "all") {
      statsSourceReservations = statsSourceReservations.filter(r => r.type === reservationType);
    }
    
    const relevantReservationsForPeriod = statsSourceReservations.filter(r => {
        const checkInTime = r.checkIn.getTime();
        const checkOutTime = r.checkOut.getTime();
        // Reservation overlaps with the period if:
        // it starts before period ends AND it ends after period starts
        return checkInTime < endDate.getTime() && checkOutTime > startDate.getTime();
    });

    const checkInsInPeriod = relevantReservationsForPeriod.filter(r => 
        r.checkIn >= startDate && r.checkIn <= endDate
    ).length;
    
    const checkOutsInPeriod = relevantReservationsForPeriod.filter(r => 
        r.checkOut >= startDate && r.checkOut <= endDate // Check-outs *within* the current month
    ).length;

    const totalGuestsInPeriod = relevantReservationsForPeriod.reduce((sum, r) => {
        // Only count guests if their stay overlaps the stats period
        const stayStart = r.checkIn > startDate ? r.checkIn : startDate;
        const stayEnd = r.checkOut < endDate ? r.checkOut : endDate;
        if (stayEnd > stayStart) { // If there is an actual overlap
            return sum + (r.guests.adults || 0) + (r.guests.children || 0) + (r.guests.seniors || 0);
        }
        return sum;
    }, 0);
    
    const numberOfRooms = Object.keys(roomLookup).length; 
    const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1; // Inclusive days
    const totalRoomDaysPossible = numberOfRooms * daysInPeriod;
    
    let bookedRoomNightsInPeriod = 0;
    relevantReservationsForPeriod.forEach(r => {
        // Consider only statuses that imply occupancy or holding the room
        if (["Accepted", "Checked_In", "Confirmed_Pending_Payment"].includes(r.status as StatusValue)) {
            const actualStayStart = r.checkIn > startDate ? r.checkIn : startDate;
            const actualStayEnd = r.checkOut < endDate ? r.checkOut : endDate;
            
            // Create date objects at midnight to count full days accurately for occupancy
            const dayStart = new Date(actualStayStart.getFullYear(), actualStayStart.getMonth(), actualStayStart.getDate());
            const dayEnd = new Date(actualStayEnd.getFullYear(), actualStayEnd.getMonth(), actualStayEnd.getDate());

            if (dayEnd.getTime() > dayStart.getTime()) {
                bookedRoomNightsInPeriod += (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24);
            }
        }
    });
    
    const occupancyRate = totalRoomDaysPossible > 0 
        ? Math.round((bookedRoomNightsInPeriod / totalRoomDaysPossible) * 100)
        : 0;
    
    return { 
        checkIns: checkInsInPeriod, 
        checkOuts: checkOutsInPeriod, 
        totalGuests: totalGuestsInPeriod, 
        occupancyRate 
    };
  }, [reservations, reservationType, roomLookup]); 

  return {
    filteredReservations,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    reservationType,
    setReservationType,
    filterOptions,
    setFilterOptions: setFilterOptions as (options: FilterOptions & { paymentStatus: PaymentFilterStatus }) => void, // Cast for safety
    statistics
  };
};