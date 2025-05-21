// src/utils/fetchReservations.ts

import { supabase } from "@/lib/supabaseClient"; 

export interface CustomerDetails {
  name: string;
  phone: string;
  customer_name_at_booking?: string; 
}
export interface CustomerLookup {
  [customerId: string]: CustomerDetails;
}

export interface StaffDetails {
  name: string;
  role?: string;  
  phone?: string; 
}
export interface StaffLookup {
  [staffId: string]: StaffDetails;
}

export interface RoomDetails {
  name: string;
  price?: number; // Price per night for the room type
}
export interface RoomLookup {
  [roomId: string]: RoomDetails;
}

export interface FetchReservationsResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reservations: any[]; // Raw reservation objects, specific typing done in useReservations hook
  customerLookup: CustomerLookup;
  staffLookup: StaffLookup;
  roomLookup: RoomLookup;
}

export const fetchReservations = async (): Promise<FetchReservationsResult> => {
  console.log("FETCH_RESERVATIONS: Starting to fetch all reservation data and related lookups...");
  
  // Step 1: Fetch all reservation data
  const { data: rawReservations, error: reservationsError } = await supabase
    .from("reservations")
    .select('*') // Select all columns from reservations for now
    .order('timestamp', { ascending: false }); 

  // Log the raw response for reservations
  // console.log("FETCH_RESERVATIONS: Raw 'reservations' table response:", { 
  //   count: rawReservations?.length || 0, 
  //   error: reservationsError 
  // });
  
  if (reservationsError) {
    console.error("FETCH_RESERVATIONS: Critical error fetching reservations:", reservationsError.message, reservationsError.details);
    return { reservations: [], customerLookup: {}, staffLookup: {}, roomLookup: {} };
  }
  
  const reservationsToProcess = rawReservations || []; 
  if (reservationsToProcess.length === 0) {
    console.log("FETCH_RESERVATIONS: No reservation data found in the database.");
    return { reservations: [], customerLookup: {}, staffLookup: {}, roomLookup: {} };
  }

  // Step 2: Extract unique IDs for fetching related data
  const customerIds = [...new Set(reservationsToProcess.map(r => r.customer_id).filter(Boolean))];
  const staffIds = [...new Set(reservationsToProcess.map(r => r.audited_by).filter(Boolean))];
  const roomIds = [...new Set(reservationsToProcess.map(r => r.room_id).filter(Boolean))];
  
  // console.log("FETCH_RESERVATIONS: Unique IDs found - Customers:", customerIds.length, "Staff:", staffIds.length, "Rooms:", roomIds.length);

  // Step 3: Initialize lookup tables
  const customerLookup: CustomerLookup = {};
  const staffLookup: StaffLookup = {};
  const roomLookup: RoomLookup = {}; // This will store RoomDetails objects

  // Step 4: Fetch related data for lookup tables

  // --- Fetch Customer Data ---
  if (customerIds.length > 0) {
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select("id, full_name, phone_number") 
      .in("id", customerIds);

    if (customerError) {
      console.error("FETCH_RESERVATIONS: Error fetching customers data:", customerError.message);
    } else if (customerData) {
      // console.log("FETCH_RESERVATIONS: Fetched", customerData.length, "customer details.");
      customerData.forEach(customer => {
        if (customer.id) { 
            customerLookup[String(customer.id)] = {
            phone: String(customer.phone_number || "N/A"),
            name: String(customer.full_name || "Unknown Name"),
            // customer_name_at_booking will be potentially overridden later
          };
        }
      });
    }
  }

  // --- Fetch Staff Data ---
  if (staffIds.length > 0) {
    const { data: staffData, error: staffError } = await supabase
      .from('staff')  
      .select('user_id, name, position, phone_number') 
      .in('user_id', staffIds);  
    
    if (staffError) {
      console.error("FETCH_RESERVATIONS: Error fetching staff data:", staffError.message);
    } else if (staffData) {
      // console.log("FETCH_RESERVATIONS: Fetched", staffData.length, "staff details.");
      staffData.forEach(staff => {
        if (staff.user_id) { 
            staffLookup[String(staff.user_id)] = {
                name: String(staff.name || `Staff ID: ${staff.user_id}`),
                role: staff.position ? String(staff.position) : undefined,
                phone: staff.phone_number ? String(staff.phone_number) : undefined,
            };
        }
      });
    }
  }
  
  // --- Fetch Room Data (including room_price) ---
  if (roomIds.length > 0) {
    const { data: roomDataFromDB, error: roomError } = await supabase
      .from('rooms')
      .select('id, name, room_price') 
      .in('id', roomIds);
      
    if (roomError) {
      console.error("FETCH_RESERVATIONS: Error fetching rooms data:", roomError.message);
    } else if (roomDataFromDB) {
      // console.log("FETCH_RESERVATIONS: Fetched", roomDataFromDB.length, "room details. First room raw:", roomDataFromDB[0]);
      roomDataFromDB.forEach(room => {
        if (room.id) { 
            roomLookup[String(room.id)] = { 
                name: String(room.name || `Room ID: ${room.id}`),
                price: (room.room_price !== null && room.room_price !== undefined) 
                       ? Number(room.room_price) 
                       : undefined // Store price as number or undefined
            };
        }
      });
    }
  }

  // Step 5: Post-process reservations to refine customer_name_at_booking and apply fallbacks
  reservationsToProcess.forEach(reservation => {
    const customerIdStr = String(reservation.customer_id); // Ensure string key
    if (customerIdStr) {
      // If customer wasn't found in the 'customers' table fetch, create a basic entry from reservation data
      if (!customerLookup[customerIdStr]) {
        customerLookup[customerIdStr] = {
          name: String(reservation.customer_name_at_booking || 'Unknown Guest'),
          phone: String(reservation.customer_phone_at_booking || 'N/A'),
          customer_name_at_booking: String(reservation.customer_name_at_booking || undefined)
        };
      } else {
        // If customer was found, ensure customer_name_at_booking from reservation record is stored if present
        if (reservation.customer_name_at_booking && !customerLookup[customerIdStr].customer_name_at_booking) {
          customerLookup[customerIdStr].customer_name_at_booking = String(reservation.customer_name_at_booking);
        }
      }
    }
    
    // Fallback for staff if not found in 'staff' table lookup
    const staffIdStr = String(reservation.audited_by);
    if (staffIdStr && !staffLookup[staffIdStr]) {
      staffLookup[staffIdStr] = { name: `Staff ID: ${staffIdStr} (Details N/A)` };
    }
    
    // Fallback for rooms if not found in 'rooms' table lookup
    const roomIdStr = String(reservation.room_id);
    if (roomIdStr && !roomLookup[roomIdStr]) {
      roomLookup[roomIdStr] = { name: `Room ID: ${roomIdStr} (Details N/A)`, price: undefined };
    }
  });

  // Final logs before returning
  // console.log("FETCH_RESERVATIONS: First processed reservation (raw):", reservationsToProcess?.[0]);
  // console.log("FETCH_RESERVATIONS: Final Customer Lookup entries:", Object.keys(customerLookup).length);
  // console.log("FETCH_RESERVATIONS: Final Staff Lookup entries:", Object.keys(staffLookup).length);
  // console.log("FETCH_RESERVATIONS: Final Room Lookup (should have prices):", roomLookup);
  
  return {
    reservations: reservationsToProcess, 
    customerLookup,
    staffLookup,
    roomLookup
  };
};

// --- Real-time subscription functionality ---
let reservationsSubscription: { unsubscribe: () => void } | null = null;

export const subscribeToReservationChanges = (
  onReservationsChange: (result: FetchReservationsResult) => void
): { unsubscribe: () => void } => {
  if (reservationsSubscription) {
    reservationsSubscription.unsubscribe();
  }
  console.log("SUBSCRIBE_RESERVATIONS: Setting up real-time subscription...");
  
  fetchReservations().then(onReservationsChange); 
  
  const channel = supabase.channel('reservation-realtime-changes');

  const commonPayloadHandler = (payload: Record<string, unknown>, tableName: string) => {
    console.log(`SUBSCRIBE_RESERVATIONS: Change detected in '${tableName}' table. Payload:`, payload);
    fetchReservations().then(onReservationsChange);
  };

  channel
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (p) => commonPayloadHandler(p, 'reservations'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (p) => commonPayloadHandler(p, 'customers'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, (p) => commonPayloadHandler(p, 'staff'))
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (p) => commonPayloadHandler(p, 'rooms'))
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('SUBSCRIBE_RESERVATIONS: Successfully subscribed to real-time changes!');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error('SUBSCRIBE_RESERVATIONS: Subscription error.', { status, err });
      } else {
        console.log('SUBSCRIBE_RESERVATIONS: Subscription status changed:', status);
      }
    });

  reservationsSubscription = { unsubscribe: () => channel.unsubscribe() };

  return {
    unsubscribe: () => {
      if (reservationsSubscription) {
        console.log("SUBSCRIBE_RESERVATIONS: Unsubscribing from real-time changes...");
        reservationsSubscription.unsubscribe();
        reservationsSubscription = null;
      }
    }
  };
};