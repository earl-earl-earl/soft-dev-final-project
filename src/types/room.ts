export type RoomStatus = "Occupied" | "Vacant";

export interface Reservation {
  checkIn: Date;
  checkOut: Date;
  guestName: string;
}

export interface Room {
  id: string;
  name: string;
  roomNumber: string;
  capacity: number;
  lastUpdated: string;
  amenities: string[];
  price: number;
  status: RoomStatus;
  reservation?: Reservation;
  isActive: boolean;
  [key: string]: unknown;
}

export interface RoomStats {
  totalRooms: number;
  totalRoomsChange: number;
  occupied: number;
  occupiedChange: number;
  available: number;
  availableChange: number;
}

export interface RoomFormData {
  name: string;
  roomNumber: string;
  capacity: number;
  price: number;
  amenities: string[];
  isActive: boolean;
}

export interface RoomFilterOptions {
  minCapacity: string;
  maxCapacity: string;
  minPrice: string;
  maxPrice: string;
  availableFrom: string;
  availableTo: string;
  isActive: 'all' | 'active' | 'inactive';
  sortBy: 'none' | 'name_asc' | 'name_desc' | 'id_asc' | 'id_desc';
}