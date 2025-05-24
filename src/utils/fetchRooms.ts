// src/utils/fetchRooms.ts
import { supabase } from "@/lib/supabaseClient";
import { Room, Reservation } from "../types/room";

export interface ReservationLookup {
  [key: string]: Reservation[]; 
}

export interface FetchRoomsResult {
  rooms?: Room[]; 
  reservationLookup?: ReservationLookup;
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
  const reservationLookup: ReservationLookup = {}; 
  
  if (roomIds.length > 0) {
    const { data: reservationsData, error: reservationsError } = await supabase
      .from("reservations")
      .select(`id, room_id, customer_id, customer_name_at_booking, check_in, check_out, status`)
      // .in('room_id', roomIds)
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
    let determinedLastUpdated: string;
    if (dbRoom.last_updated) { 
      determinedLastUpdated = dbRoom.last_updated; // Prefer this if it exists
    } else if (dbRoom.updated_at) { // Supabase's default update timestamp
      determinedLastUpdated = dbRoom.updated_at;
    } else if (dbRoom.created_at) {
      determinedLastUpdated = dbRoom.created_at;
    } else {
      determinedLastUpdated = new Date().toISOString();
    }

    return {
      // Fields that directly match between dbRoom (snake_case) and Room type (snake_case)
      id: dbRoom.id, // Room type has id: number
      name: dbRoom.name || "Unnamed Room",
      capacity: dbRoom.capacity || 1,
      amenities: dbRoom.amenities || [],
      room_price: dbRoom.room_price || 0,    // Room type has room_price
      last_updated: determinedLastUpdated,   // Room type has last_updated
      created_at: dbRoom.created_at,
      
      image_paths: dbRoom.image_paths || [],
      panoramic_image_path: dbRoom.panoramic_image_path || undefined,

      // Field that needs mapping from dbRoom (snake_case) to Room type (camelCase)
      isActive: typeof dbRoom.is_active === 'boolean' ? dbRoom.is_active : true, // Room type has isActive

      // status and reservation are no longer added here
    };
  });
  
  return {
    rooms,
    reservationLookup
  };
};

// formatDate and subscribeToRoomsChanges can remain the same as previously provided
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
        console.log('fetchRooms: Successfully subscribed to real-time changes!');
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