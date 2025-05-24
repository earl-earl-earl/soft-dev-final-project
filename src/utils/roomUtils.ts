import { Room, RoomFilterOptions } from '../types/room';

export const formatCurrency = (value: number): string => {
  return value.toLocaleString() + '.00';
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

export const filterRooms = (
  rooms: Room[],
  searchTerm: string,
  statusFilter: 'all' | 'Occupied' | 'Vacant',
  filterOptions: RoomFilterOptions
): Room[] => {
  // First apply all filters
  let filteredRooms = rooms.filter((room) => {
    // Status filter
    if (statusFilter !== "all" && room.status !== statusFilter) return false;
    
    // Search term filter
    if (
      searchTerm && 
      !room.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
      //!room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()
      !room.id.toString().toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    
    // Capacity filter
    if (filterOptions.minCapacity && room.capacity < parseInt(filterOptions.minCapacity)) return false;
    if (filterOptions.maxCapacity && room.capacity > parseInt(filterOptions.maxCapacity)) return false;
    
    // Price filter
    if (filterOptions.minPrice && typeof room.price === 'number' && room.price < parseInt(filterOptions.minPrice)) return false;
    if (filterOptions.maxPrice && typeof room.price === 'number' && room.price > parseInt(filterOptions.maxPrice)) return false;
    
    // Active status filter
    if (filterOptions.isActive === 'active' && !room.isActive) return false;
    if (filterOptions.isActive === 'inactive' && room.isActive) return false;
    
    // Date availability filter
    if (filterOptions.availableFrom && filterOptions.availableTo) {
      const fromDate = new Date(filterOptions.availableFrom);
      const toDate = new Date(filterOptions.availableTo);
      
      if (room.status === "Occupied" && room.reservation) {
        // Check if reservation overlaps with requested period
        const checkIn = new Date(room.reservation.checkIn);
        const checkOut = new Date(room.reservation.checkOut);
        
        if (checkOut > fromDate && checkIn < toDate) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Then apply sorting
  if (filterOptions.sortBy !== 'none') {
    filteredRooms = [...filteredRooms].sort((a, b) => {
      switch (filterOptions.sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'id_asc':
          return a.id - b.id;
        case 'id_desc':
          return b.id - a.id;
        default:
          return 0;
      }
    });
  }

  return filteredRooms;
};