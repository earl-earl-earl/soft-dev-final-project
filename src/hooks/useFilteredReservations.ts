import { useState, useMemo } from "react";
import { 
  ReservationItem, 
  ReservationType, 
  FilterOptions, 
  CustomerLookup, 
  RoomLookup 
} from "../types/reservation";
import { getStatusCategory } from "../utils/reservationUtils";

interface UseFilteredReservationsProps {
  reservations: ReservationItem[];
  customerLookup: CustomerLookup;
  roomLookup: RoomLookup;
}

interface UseFilteredReservationsReturn {
  filteredReservations: ReservationItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  reservationType: ReservationType;
  setReservationType: (type: ReservationType) => void;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  statistics: {
    checkIns: number;
    checkOuts: number;
    totalGuests: number;
    occupancyRate: number;
  };
}

export const useFilteredReservations = ({
  reservations,
  customerLookup,
  roomLookup
}: UseFilteredReservationsProps): UseFilteredReservationsReturn => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reservationType, setReservationType] = useState<ReservationType>("all");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
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
    let reservationsList = reservations;
    
    // Filter by reservation type
    if (reservationType !== "all") {
      reservationsList = reservationsList.filter(reservation => reservation.type === reservationType);
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      reservationsList = reservationsList.filter(
        (reservation) => getStatusCategory(reservation.status) === statusFilter
      );
    }
    
    // Apply advanced filters
    if (filterOptions.checkInStart) {
      const startDate = new Date(filterOptions.checkInStart);
      reservationsList = reservationsList.filter(r => r.checkIn >= startDate);
    }
    
    if (filterOptions.checkInEnd) {
      const endDate = new Date(filterOptions.checkInEnd);
      endDate.setHours(23, 59, 59, 999); // Ensure end of day
      reservationsList = reservationsList.filter(r => r.checkIn <= endDate);
    }
    
    if (filterOptions.checkOutStart) {
      const startDate = new Date(filterOptions.checkOutStart);
      reservationsList = reservationsList.filter(r => r.checkOut >= startDate);
    }
    
    if (filterOptions.checkOutEnd) {
      const endDate = new Date(filterOptions.checkOutEnd);
      endDate.setHours(23, 59, 59, 999); // Ensure end of day
      reservationsList = reservationsList.filter(r => r.checkOut <= endDate);
    }
    
    if (filterOptions.paymentStatus !== 'all') {
      const isPaid = filterOptions.paymentStatus === 'paid';
      reservationsList = reservationsList.filter(r => r.paymentReceived === isPaid);
    }
    
    if (filterOptions.minGuests) {
      const min = parseInt(filterOptions.minGuests);
      if (!isNaN(min)) {
        reservationsList = reservationsList.filter(r => {
          const total = r.guests.adults + r.guests.children + r.guests.seniors;
          return total >= min;
        });
      }
    }
    
    if (filterOptions.maxGuests) {
      const max = parseInt(filterOptions.maxGuests);
      if (!isNaN(max)) {
        reservationsList = reservationsList.filter(r => {
          const total = r.guests.adults + r.guests.children + r.guests.seniors;
          return total <= max;
        });
      }
    }
    
    if (filterOptions.roomId !== 'all') {
      reservationsList = reservationsList.filter(r => r.roomId === filterOptions.roomId);
    }
    
    // Search filter
    if (!searchTerm.trim()) {
      return reservationsList;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return reservationsList.filter((reservation) => {
      const customerName = customerLookup[reservation.customerId]?.name || "";
      const customerPhone = customerLookup[reservation.customerId]?.phone || "";
      const roomName = roomLookup[reservation.roomId]?.name || "";
      const statusCategory = getStatusCategory(
        reservation.status
      ).toLowerCase();
      return (
        reservation.id.toLowerCase().includes(lowerSearchTerm) ||
        customerName.toLowerCase().includes(lowerSearchTerm) ||
        customerPhone
          .replace(/\s+/g, "")
          .includes(lowerSearchTerm.replace(/\s+/g, "")) ||
        roomName.toLowerCase().includes(lowerSearchTerm) ||
        reservation.customerId.toLowerCase().includes(lowerSearchTerm) ||
        reservation.roomId.toLowerCase().includes(lowerSearchTerm) ||
        reservation.status.toLowerCase().includes(lowerSearchTerm) ||
        statusCategory.includes(lowerSearchTerm)
      );
    });
  }, [reservations, searchTerm, statusFilter, reservationType, filterOptions, customerLookup, roomLookup]);

  // Calculate statistics based on current filter
  const statistics = useMemo(() => {
    // Define date range
    const startDate = new Date(2025, 0, 1); // Jan 1, 2025
    const endDate = new Date(2025, 3, 30, 23, 59, 59, 999); // April 30, 2025, end of day
    
    // Filter reservations by type and date range
    let reservationsForStats = reservations; 
    if (reservationType !== "all") {
      reservationsForStats = reservationsForStats.filter(r => r.type === reservationType);
    }
    
    // Filter for specified date range based on check-in date
    reservationsForStats = reservationsForStats.filter(r => 
      r.checkIn >= startDate && r.checkIn <= endDate
    );
    
    const checkIns = reservationsForStats.length;
    
    // Filter for check-outs within the date range
    const checkOuts = reservationsForStats.filter(r => r.checkOut <= endDate).length;

    const totalGuests = reservationsForStats.reduce((sum, r) => 
      sum + r.guests.adults + r.guests.children + r.guests.seniors, 0);
    
    // For occupancy rate calculation
    const numberOfRooms = Object.keys(roomLookup).length; 
    const daysInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const maxPossibleBookings = numberOfRooms * daysInPeriod; 
    
    let bookedRoomDays = 0;
    reservationsForStats.forEach(r => {
        const stayStart = r.checkIn > startDate ? r.checkIn : startDate;
        const stayEnd = r.checkOut < endDate ? r.checkOut : endDate;
        if (stayEnd > stayStart) {
            bookedRoomDays += (stayEnd.getTime() - stayStart.getTime()) / (1000 * 60 * 60 * 24);
        }
    });

    const occupancyRate = maxPossibleBookings > 0 
        ? Math.round((bookedRoomDays / maxPossibleBookings) * 100)
        : 0;
    
    return { checkIns, checkOuts, totalGuests, occupancyRate };
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
    setFilterOptions,
    statistics
  };
};