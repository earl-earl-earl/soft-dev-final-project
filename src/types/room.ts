// src/types/room.ts

// For client-side display/filtering, not directly in core Room DB model if derived
export type RoomStatus = "Occupied" | "Vacant";

// Reservation type if used for displaying reservation details alongside a room
export interface Reservation {
  checkIn: Date;  // Or string if you handle date conversion elsewhere
  checkOut: Date; // Or string
  guestName: string;
}

// Core Room interface: This should accurately reflect the structure of objects
// returned by your GET /api/rooms endpoint.
export interface Room {
  id: number;                   // From your API response, ID is a number
  name: string;
  capacity: number;
  amenities: string[];
  isActive: boolean;           // Matches API response
  last_updated: string;         // Matches API response (ISO date string)
  room_price: number;           // Matches API response (key is room_price)
  created_at?: string;          // Present in your API response, added as optional

  image_paths?: string[];         // Key matches API response, array of public URLs
  panoramic_image_path?: string;  // Key matches API response, public URL

  // These are likely derived or for additional client-side state,
  // not necessarily direct fields from the 'rooms' table API GET response.
  status?: RoomStatus;          // Derived based on is_active or reservations
  reservation?: Reservation;    // Likely joined or fetched separately

  // To allow for other potential properties if your API sends more
  [key: string]: unknown;
}

// Statistics about rooms
export interface RoomStats {
  totalRooms: number;
  totalRoomsChange: number;
  occupied: number;
  occupiedChange: number;
  available: number;
  availableChange: number;
}

// RoomFormData: Data structure for FORMS (AddRoomOverlay, EditRoomOverlay).
// This is what the client-side forms manage and what useRooms expects for add/update operations
// before it's converted to FormData for the API.
export interface RoomFormData {
  name: string;
  capacity: number;
  price: number;                 // Client-side forms use 'price' (camelCase)
  amenities: string[];
  is_active: boolean;            // Client-side forms use 'is_active'

  // For regular images: an array of new Files or existing URLs (strings)
  images: (File | string)[]; 

  // For panoramic image: a new File, an existing URL (string), or null for removal
  panoramicImage?: File | string | null; 
}

// Options for filtering rooms
export interface RoomFilterOptions {
  minCapacity: string;
  maxCapacity: string;
  minPrice: string;
  maxPrice: string;
  availableFrom: string;
  availableTo: string;
  isActive: 'all' | 'active' | 'inactive'; // Filter criteria
  sortBy: 'none' | 'name_asc' | 'name_desc' | 'id_asc' | 'id_desc';
}