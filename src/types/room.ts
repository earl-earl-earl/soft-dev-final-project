// src/types/room.ts

// This seems to be for display/filtering, keep if needed, but not directly in core Room DB model
export type RoomStatus = "Occupied" | "Vacant";

// Reservation type is fine if used elsewhere
export interface Reservation {
  checkIn: Date;
  checkOut: Date;
  guestName: string;
}

// Core Room interface, matching database and API response
export interface Room {
  id: string; // Or number, depending on your DB's actual ID type (Supabase serial is number)
  name: string;
  // roomNumber: string; // REMOVED
  capacity: number;
  price: number; // Assuming price is still a field, though not in your initial DB schema for rooms
  amenities: string[];
  is_active: boolean; // Renamed from isActive to match DB snake_case
  last_updated: string; // Renamed from lastUpdated and type to string (ISO date string)
  
  // New image fields from DB
  image_paths?: string[];         // Array of public URLs for regular images
  panoramic_image_path?: string;  // Public URL for panoramic image

  // These are likely derived or for client-side state, not direct DB fields for 'rooms' table
  status?: RoomStatus;          // Derived based on is_active or reservations
  reservation?: Reservation;    // Likely joined or fetched separately

  // To allow for other potential properties from Supabase or joins
  [key: string]: unknown;
}

// RoomStats interface looks fine for its purpose
export interface RoomStats {
  totalRooms: number;
  totalRoomsChange: number;
  occupied: number;
  occupiedChange: number;
  available: number;
  availableChange: number;
}

// RoomFormData: This is what the FORMS (AddRoomOverlay, EditRoomOverlay) will submit
// It will be converted to FormData for API calls involving files.
export interface RoomFormData {
  name: string;
  // roomNumber: string; // REMOVED
  capacity: number;
  price: number; // Keep if your form collects it
  amenities: string[];
  is_active: boolean; // Changed from isActive to is_active to align with db and API

  // For regular images: an array of new Files or existing URLs (strings)
  // This is primarily for the Edit form. Add form will only have Files.
  images: (File | string)[]; 

  // For panoramic image: a new File, an existing URL (string),
  // or null to indicate removal (for Edit form).
  // Add form will have File or undefined.
  panoramicImage?: File | string | null; 
}

// RoomFilterOptions looks fine for its purpose
export interface RoomFilterOptions {
  minCapacity: string;
  maxCapacity: string;
  minPrice: string;
  maxPrice: string;
  availableFrom: string;
  availableTo: string;
  isActive: 'all' | 'active' | 'inactive'; // 'isActive' here refers to the filter, not the room property directly
  sortBy: 'none' | 'name_asc' | 'name_desc' | 'id_asc' | 'id_desc';
}