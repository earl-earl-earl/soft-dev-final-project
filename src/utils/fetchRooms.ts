// src/utils/fetchRooms.ts
import { supabase } from "@/lib/supabaseClient"; // Assuming this path is correct
import { Room, Reservation } from "../types/room";   // Your Room and Reservation types

export interface ReservationLookup {
  [key: string]: Reservation[]; 
}

export interface FetchRoomsResult {
  rooms?: Room[]; 
  reservationLookup?: ReservationLookup; // Still useful if other parts of app need it
  error?: string; 
}

// Main fetch function
export const fetchRooms = async (): Promise<FetchRoomsResult> => {
  // console.log("fetchRooms: Starting to fetch rooms and reservations...");
  
  const { data: roomsData, error: roomsError } = await supabase
    .from("rooms")
    .select('*'); 

  if (roomsError) {
    console.error("fetchRooms: Error fetching rooms from Supabase:", roomsError.message);
    return { error: `Database error fetching rooms: ${roomsError.message}` };
  }
  
  if (!roomsData || roomsData.length === 0) {
    return { rooms: [], reservationLookup: {} }; 
  }

  const roomIds = roomsData.map(room => room.id); 
  const reservationLookup: ReservationLookup = {}; // Keep this if other parts of your app use it
  
  // Fetching reservations can still be useful for other parts of the app,
  // or you can remove this whole block if reservationLookup is no longer needed anywhere.
  if (roomIds.length > 0) {
    const { data: reservationsData, error: reservationsError } = await supabase
      .from("reservations")
      .select(`
        id,
        room_id,
        customer_id,
        customer_name_at_booking,
        check_in,
        check_out,
        status 
      `) // Assuming 'status' here is reservation_status enum
      // .in('room_id', roomIds)
      // // You might still want to filter reservations if reservationLookup is used elsewhere
      // // For example, only show current/future non-cancelled reservations in the lookup
      // .gte('check_out', new Date().toISOString().split('T')[0]) 
      // .not('status', 'in', ['Cancelled', 'Rejected']);

    if (reservationsError) {
      console.error("fetchRooms: Error fetching reservations:", reservationsError.message);
    } else if (reservationsData && reservationsData.length > 0) {
      reservationsData.forEach(reservation => {
        const roomId = String(reservation.room_id); 
        if (!reservationLookup[roomId]) {
          reservationLookup[roomId] = [];
        }
        
        reservationLookup[roomId].push({
          checkIn: new Date(reservation.check_in),
          checkOut: new Date(reservation.check_out),
          guestName: reservation.customer_name_at_booking || 'N/A' 
        });
      });
    }
  }
  
  const rooms: Room[] = roomsData.map(dbRoom => {
    let lastUpdatedValue: string;
    if (dbRoom.last_updated) { 
      lastUpdatedValue = dbRoom.last_updated;
    } else if (dbRoom.updated_at) { 
      lastUpdatedValue = dbRoom.updated_at;
    } else if (dbRoom.created_at) { 
      lastUpdatedValue = dbRoom.created_at;
    } else {
      lastUpdatedValue = new Date().toISOString(); 
    }

    // This object structure MUST EXACTLY MATCH your `Room` interface in `src/types/room.ts`
    return {
      id: dbRoom.id, 
      name: dbRoom.name || "Unnamed Room",
      capacity: dbRoom.capacity || 1,
      room_price: dbRoom.room_price || 0,        // Matches 'Room' type (snake_case from DB)
      amenities: dbRoom.amenities || [],
      isActive: typeof dbRoom.is_active === 'boolean' ? dbRoom.is_active : true,  // Add camelCase for Room interface
      last_updated: lastUpdatedValue,            // Matches 'Room' type (snake_case from DB)
      created_at: dbRoom.created_at,             // Matches 'Room' type (snake_case from DB, optional)
      
      image_paths: dbRoom.image_paths || [],
      panoramic_image_path: dbRoom.panoramic_image_path || undefined,
      
      // VVVVVV REMOVED THESE DERIVED FIELDS VVVVVV
      // status: currentReservation ? "Occupied" : "Vacant",
      // reservation: currentReservation ? { ... } : undefined,
      // ^^^^^^ REMOVED THESE DERIVED FIELDS ^^^^^^
    };
  });
  
  return {
    rooms,
    reservationLookup // You can choose to remove reservationLookup too if it's not used
  };
};

// formatDate and subscribeToRoomsChanges remain the same
const formatDate = (dateInput: string | Date): string => {
  if (!dateInput) return 'N/A';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'Invalid Date'; 
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return 'Error Formatting Date';
  }
};

let roomsSubscription: { unsubscribe: () => void } | null = null;

export const subscribeToRoomsChanges = (
  onRoomsChange: (result: FetchRoomsResult) => void
): { unsubscribe: () => void } => {
  if (roomsSubscription) {
    roomsSubscription.unsubscribe();
  }
  
  fetchRooms().then(onRoomsChange); 
  
  const channel = supabase.channel('room-and-reservation-changes');

  channel
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'rooms' }, 
      (payload) => {
        fetchRooms().then(onRoomsChange);
      }
    )
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'reservations' },
      (payload) => {
        fetchRooms().then(onRoomsChange);
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        // console.log('fetchRooms: Successfully subscribed to real-time changes!');
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('fetchRooms: Real-time subscription error:', status, err);
      }
    });

  roomsSubscription = { unsubscribe: () => channel.unsubscribe() };

  return {
    unsubscribe: () => {
      if (roomsSubscription) {
        roomsSubscription.unsubscribe();
        roomsSubscription = null;
      }
    }
  };
};