import { useState, useMemo, useEffect } from 'react';
import { Room, RoomFilterOptions, RoomStats } from '../types/room';
import { filterRooms } from '../utils/roomUtils';

interface UseFilteredRoomsProps {
  rooms: Room[];
}

interface UseFilteredRoomsReturn {
  filteredRooms: Room[];
  currentRooms: Room[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | 'Occupied' | 'Vacant';
  setStatusFilter: (status: 'all' | 'Occupied' | 'Vacant') => void;
  filterOptions: RoomFilterOptions;
  setFilterOptions: (options: RoomFilterOptions) => void;
  isSingleRow: boolean;
  roomStats: RoomStats;
}

export const useFilteredRooms = ({ rooms }: UseFilteredRoomsProps): UseFilteredRoomsReturn => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 6;

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Occupied' | 'Vacant'>('all');
  const [filterOptions, setFilterOptions] = useState<RoomFilterOptions>({
    minCapacity: '',
    maxCapacity: '',
    minPrice: '',
    maxPrice: '',
    availableFrom: '',
    availableTo: '',
    isActive: 'all',
    sortBy: 'none'
  });

  // Calculate filtered rooms based on all filters
  const filteredRooms = useMemo(() => {
    return filterRooms(rooms, searchTerm, statusFilter, filterOptions);
  }, [rooms, searchTerm, statusFilter, filterOptions]);

  // Calculate pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredRooms.length / roomsPerPage);
  }, [filteredRooms, roomsPerPage]);

  // Calculate current page rooms
  const currentRooms = useMemo(() => {
    const indexOfFirstRoom = (currentPage - 1) * roomsPerPage;
    const indexOfLastRoom = indexOfFirstRoom + roomsPerPage;
    return filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);
  }, [filteredRooms, currentPage, roomsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, filterOptions]);

  // Calculate if we're showing a single row of rooms (3 or fewer)
  const isSingleRow = currentRooms.length <= 3;

  // Calculate room statistics
  const roomStats = useMemo(() => {
    const activeRooms = rooms.filter(room => room.isActive);
    const occupied = activeRooms.filter(room => room.status === 'Occupied').length;
    const available = activeRooms.filter(room => room.status === 'Vacant').length;

    return {
      totalRooms: rooms.length,
      totalRoomsChange: 30, // This would typically be calculated from historical data
      occupied,
      occupiedChange: -8, // This would typically be calculated from historical data
      available,
      availableChange: 69 // This would typically be calculated from historical data
    };
  }, [rooms]);

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