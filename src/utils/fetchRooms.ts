import { supabase } from "@/lib/supabaseClient";
import { Room, Reservation } from "../types/room";

export interface ReservationLookup {
  [key: string]: Reservation[];
}

export interface FetchRoomsResult {
  rooms: Room[];
  reservationLookup: ReservationLookup;
}

// Main fetch function
export const fetchRooms = async (): Promise<FetchRoomsResult> => {
  console.log("Starting to fetch rooms...");
  
  // Fetch room data
  const { data: roomsData, error: roomsError } = await supabase
    .from("rooms")
    .select('*');

  console.log("Raw rooms response from Supabase:", { data: roomsData?.length || 0, error: roomsError });
  
  if (roomsError) {
    console.error("Error fetching rooms:", roomsError.message);
    return { rooms: [], reservationLookup: {} };
  }
  
  if (!roomsData || roomsData.length === 0) {
    console.log("No room data returned from the database");
    return { rooms: [], reservationLookup: {} };
  }

  // Extract room IDs for reservations lookup
  const roomIds = roomsData.map(room => room.id);
  
  // Create reservation lookup table
  const reservationLookup: ReservationLookup = {};
  
  // Fetch active reservations for rooms
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
    `)
    .in('room_id', roomIds)
    .gte('check_out', new Date().toISOString())
    .not('status', 'eq', 'Cancelled')
    .not('status', 'eq', 'Rejected');
  
  if (reservationsError) {
    console.error("Error fetching reservations for rooms:", reservationsError.message);
  } else if (reservationsData && reservationsData.length > 0) {
    console.log("Found reservations for rooms:", reservationsData.length);
    
    // Group reservations by room_id
    reservationsData.forEach(reservation => {
      const roomId = reservation.room_id;
      if (!reservationLookup[roomId]) {
        reservationLookup[roomId] = [];
      }
      
      reservationLookup[roomId].push({
        checkIn: new Date(reservation.check_in),
        checkOut: new Date(reservation.check_out),
        guestName: reservation.customer_name_at_booking || 'Unknown Guest' // Update this to match the column name
      });
    });
  }
  
  // Transform room data to our application format
  const rooms: Room[] = roomsData.map(room => {
    const activeReservations = reservationLookup[room.id] || [];
    const currentReservation = activeReservations.find(res => 
      new Date(res.checkIn) <= new Date() && new Date(res.checkOut) >= new Date()
    );
    
    return {
      id: room.id,
      name: room.name,
      roomNumber: room.room_number || `#${room.id}`,
      capacity: room.capacity || 1,
      price: room.room_price || 0,
      amenities: room.amenities || [],
      status: currentReservation ? "Occupied" : "Vacant",
      lastUpdated: formatDate(room.updated_at || room.created_at || new Date()),
      isActive: room.is_active !== undefined ? room.is_active : true,
      reservation: currentReservation
    };
  });

  console.log("Processed rooms:", rooms.length);
  
  return {
    rooms,
    reservationLookup
  };
};

// Helper function to format date in "Month DD, YYYY" format
const formatDate = (dateInput: string | Date): string => {
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  });
};

// Real-time subscription functionality
let roomsSubscription: { unsubscribe: () => void } | null = null;

export const subscribeToRoomsChanges = (
  onRoomsChange: (result: FetchRoomsResult) => void
): { unsubscribe: () => void } => {
  // Unsubscribe from existing subscription if there is one
  if (roomsSubscription) {
    roomsSubscription.unsubscribe();
  }

  console.log("Setting up real-time subscription to rooms...");
  
  // Initial fetch to get current state
  fetchRooms().then(onRoomsChange);
  
  // Subscribe to all changes in the rooms table
  roomsSubscription = supabase
    .channel('room-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'rooms' 
      }, 
      () => {
        console.log("Room change detected, fetching updated data...");
        fetchRooms().then(onRoomsChange);
      }
    )
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservations'
      },
      (payload) => {
        // Only refetch if it affects current rooms (based on room_id in payload)
        if (payload.new && 'room_id' in payload.new) {
          console.log("Reservation change detected, fetching updated data...");
          fetchRooms().then(onRoomsChange);
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      if (roomsSubscription) {
        console.log("Unsubscribing from rooms changes...");
        roomsSubscription.unsubscribe();
        roomsSubscription = null;
      }
    }
  };
};