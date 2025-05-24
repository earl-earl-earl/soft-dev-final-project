// src/utils/roomUtils.ts
import { Room, RoomFilterOptions, Reservation } from '../types/room';
import { ReservationLookup } from './fetchRooms';

export const formatCurrency = (value: number): string => {
  if (isNaN(value) || typeof value !== 'number') return '0.00';
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatDate = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    // year: 'numeric' // Uncomment if we want to include the year
  });
};

// Helper function to determine if a room is currently occupied
// Duplicated from useFilteredRooms.ts for now.
const isRoomCurrentlyOccupied = (roomId: number, lookup: ReservationLookup): boolean => {
  const reservations = lookup[String(roomId)] || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return reservations.some(res => {
    const checkInDate = new Date(res.checkIn); 
    checkInDate.setHours(0,0,0,0);
    const checkOutDate = new Date(res.checkOut); 
    checkOutDate.setHours(0,0,0,0);
    return checkInDate <= today && today < checkOutDate; 
  });
};

export const filterRooms = (
  roomsToFilter: Room[],
  searchTerm: string,
  statusFilter: 'all' | 'Occupied' | 'Vacant', 
  options: RoomFilterOptions, 
  reservationLookup: ReservationLookup // NEW PARAMETER
): Room[] => {
  if (!roomsToFilter) return [];

  let filteredOutput = [...roomsToFilter];

  // 1. Search term filter (on room name and ID)
  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    filteredOutput = filteredOutput.filter(room =>
      room.name.toLowerCase().includes(lowerSearchTerm) ||
      String(room.id).toLowerCase().includes(lowerSearchTerm)
    );
  }

  // 2. Status filter (Occupied/Vacant) - USES reservationLookup
  if (statusFilter !== 'all') {
    filteredOutput = filteredOutput.filter(room => {
      // Inactive rooms cannot be "Occupied" or "Vacant" in the active sense.
      // They will be handled by the options.isActive filter if set.
      if (!room.isActive && (statusFilter === 'Occupied' || statusFilter === 'Vacant')) {
        return false; 
      }
      
      const isOccupied = isRoomCurrentlyOccupied(room.id, reservationLookup);
      
      if (statusFilter === 'Occupied') {
        return room.isActive && isOccupied; 
      }
      if (statusFilter === 'Vacant') {
        return room.isActive && !isOccupied; 
      }
      return true; // Should only be 'all' at this point if not returned above
    });
  }

  // 3. Advanced filter options from RoomFilterOverlay
  // isActive filter (from advanced options)
  if (options.isActive !== 'all') {
    filteredOutput = filteredOutput.filter(room => 
      options.isActive === 'active' ? room.isActive : !room.isActive
    );
  }
  
  // Capacity filter
  const minCap = parseInt(options.minCapacity);
  const maxCap = parseInt(options.maxCapacity);
  if (!isNaN(minCap) && minCap > 0) {
    filteredOutput = filteredOutput.filter(room => room.capacity >= minCap);
  }
  if (!isNaN(maxCap) && maxCap > 0) {
    filteredOutput = filteredOutput.filter(room => room.capacity <= maxCap);
  }

  // Price filter (using room.room_price from your Room type)
  const minPrice = parseFloat(options.minPrice);
  const maxPrice = parseFloat(options.maxPrice);
  if (!isNaN(minPrice) && minPrice >= 0) {
    filteredOutput = filteredOutput.filter(room => room.room_price >= minPrice);
  }
  if (!isNaN(maxPrice) && maxPrice >= 0) {
    filteredOutput = filteredOutput.filter(room => room.room_price <= maxPrice);
  }
  
  // Date availability filter - USES reservationLookup
  if (options.availableFrom && options.availableTo) {
    try {
      const requestedFrom = new Date(options.availableFrom);
      requestedFrom.setHours(0,0,0,0);
      const requestedTo = new Date(options.availableTo); // This is the last night of stay
      requestedTo.setHours(0,0,0,0); 
      // The actual "checkout" day (exclusive end) for availability check would be requestedTo + 1 day
      const exclusiveCheckoutDate = new Date(requestedTo);
      exclusiveCheckoutDate.setDate(exclusiveCheckoutDate.getDate() + 1);


      if (!isNaN(requestedFrom.getTime()) && !isNaN(exclusiveCheckoutDate.getTime()) && requestedFrom < exclusiveCheckoutDate) {
          filteredOutput = filteredOutput.filter(room => {
              if (!room.isActive) return false; // Inactive rooms are not available

              const reservationsForRoom = reservationLookup[String(room.id)] || [];
              // A room is available if it has NO reservations that overlap with the requested period.
              // Overlap: (resStart < reqEnd_exclusive) AND (resEnd_exclusive > reqStart)
              const hasOverlappingReservation = reservationsForRoom.some(res => {
                  const resCheckIn = new Date(res.checkIn); resCheckIn.setHours(0,0,0,0);
                  const resCheckOut = new Date(res.checkOut); resCheckOut.setHours(0,0,0,0); // resCheckOut is the day they leave
                  
                  // Room is booked during [resCheckIn, resCheckOut)
                  // Requested period is [requestedFrom, exclusiveCheckoutDate)
                  return resCheckIn < exclusiveCheckoutDate && resCheckOut > requestedFrom;
              });
              return !hasOverlappingReservation;
          });
      }
    } catch (e) {
        console.error("Error parsing dates for availability filter:", e);
    }
  }

  // 4. Sorting
  if (options.sortBy !== 'none') {
    const roomsToSort = [...filteredOutput]; 
    roomsToSort.sort((a, b) => {
      switch (options.sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'id_asc':
          return a.id - b.id;
        case 'id_desc':
          return b.id - a.id;
        // case 'price_asc':
        //   return a.room_price - b.room_price;
        // case 'price_desc':
        //   return b.room_price - a.room_price;
        default:
          return 0;
      }
    });
    filteredOutput = roomsToSort;
  }

  return filteredOutput;
};