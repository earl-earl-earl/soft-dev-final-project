// src/hooks/useFilteredRooms.ts
import { useState, useMemo, useEffect } from 'react';
import { Room, RoomFilterOptions, RoomStats, Reservation } from '../types/room'; // Import Reservation
import { filterRooms } from '../utils/roomUtils';
import { ReservationLookup } from '../utils/fetchRooms';

interface UseFilteredRoomsProps {
  rooms: Room[];
  reservationLookup: ReservationLookup; 
}

interface UseFilteredRoomsReturn {
  currentRooms: Room[];
  filteredRooms: Room[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: 'all' | 'Occupied' | 'Vacant';
  setStatusFilter: React.Dispatch<React.SetStateAction<'all' | 'Occupied' | 'Vacant'>>;
  filterOptions: RoomFilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<RoomFilterOptions>>;
  isSingleRow: boolean;
  roomStats: RoomStats;
}

// Helper function to determine if a room is currently occupied
const isRoomCurrentlyOccupied = (roomId: number, lookup: ReservationLookup): boolean => {
  const reservations = lookup[String(roomId)] || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return reservations.some(res => {
    const checkInDate = new Date(res.checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    const checkOutDate = new Date(res.checkOut);
    checkOutDate.setHours(0, 0, 0, 0);
    return checkInDate <= today && today < checkOutDate;
  });
};

export const useFilteredRooms = ({ rooms, reservationLookup }: UseFilteredRoomsProps): UseFilteredRoomsReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 6;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Occupied' | 'Vacant'>('all');
  const [filterOptions, setFilterOptions] = useState<RoomFilterOptions>({
    minCapacity: '', maxCapacity: '', minPrice: '', maxPrice: '',
    availableFrom: '', availableTo: '', isActive: 'all', sortBy: 'none'
  });

  // Calculate filtered rooms based on all filters
  // filterRooms need reservationLookup to handle statusFilter
  const filteredRooms = useMemo(() => {
    // console.log("useFilteredRooms: Recalculating filteredRooms. StatusFilter:", statusFilter, "SearchTerm:", searchTerm);
    return filterRooms(rooms, searchTerm, statusFilter, filterOptions, reservationLookup);
  }, [rooms, searchTerm, statusFilter, filterOptions, reservationLookup]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredRooms.length / roomsPerPage);
  }, [filteredRooms.length, roomsPerPage]);

  const currentRooms = useMemo(() => {
    const indexOfFirstRoom = (currentPage - 1) * roomsPerPage;
    return filteredRooms.slice(indexOfFirstRoom, indexOfFirstRoom + roomsPerPage);
  }, [filteredRooms, currentPage, roomsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, filterOptions]);

  const isSingleRow = currentRooms.length <= 3;

  const roomStats = useMemo(() => {
    // console.log("useFilteredRooms: Recalculating roomStats. Rooms count:", rooms.length, "ReservationLookup keys:", Object.keys(reservationLookup).length);
    const activeRoomsFromMainList = rooms.filter(room => room.isActive);
    
    let occupiedCount = 0;
    let availableCount = 0;

    activeRoomsFromMainList.forEach(room => {
      if (isRoomCurrentlyOccupied(room.id, reservationLookup)) {
        occupiedCount++;
      } else {
        availableCount++;
      }
    });

    return {
      totalRooms: rooms.length,
      totalRoomsChange: 0,
      occupied: occupiedCount,
      occupiedChange: 0,
      available: availableCount,
      availableChange: 0
    };
  }, [rooms, reservationLookup]);

  return {
    filteredRooms,
    currentRooms,
    currentPage,
    setCurrentPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filterOptions,
    setFilterOptions,
    isSingleRow,
    roomStats
  };
};