import { supabase } from "@/lib/supabaseClient";

export interface CustomerLookup {
  [key: string]: { phone: string; name: string; };  // Include both phone and name
}

export interface StaffLookup {
  [key: string]: string;
}

export interface RoomLookup {
  [key: string]: string;  // Room ID -> Room name
}

export interface FetchReservationsResult {
  reservations: any[];
  customerLookup: CustomerLookup;
  staffLookup: StaffLookup;
  roomLookup: RoomLookup;
}

export const fetchReservations = async (): Promise<FetchReservationsResult> => {
  console.log("Starting to fetch reservations...");
  
  // Fetch reservation data
  const { data, error } = await supabase
    .from("reservations")
    .select('*');

  console.log("Raw response from Supabase:", { data: data?.length || 0, error });
  
  if (error) {
    console.error("Error fetching reservations:", error.message);
    return { reservations: [], customerLookup: {}, staffLookup: {}, roomLookup: {} };
  }
  
  if (!data || data.length === 0) {
    console.log("No reservation data returned from the database");
    return { reservations: [], customerLookup: {}, staffLookup: {}, roomLookup: {} };
  }

  // Extract unique IDs
  const customerIds = [...new Set(data.map(r => r.customer_id).filter(Boolean))];
  const staffIds = [...new Set(data.map(r => r.audited_by).filter(Boolean))];
  const roomIds = [...new Set(data.map(r => r.room_id).filter(Boolean))];
  
  console.log("Unique customer IDs:", customerIds.length);
  console.log("Unique staff IDs:", staffIds.length);
  console.log("Unique room IDs:", roomIds.length);

  // Create lookup tables
  const customerLookup: CustomerLookup = {};
  const staffLookup: StaffLookup = {};
  const roomLookup: RoomLookup = {};

  // Fetch user data for customers (phone numbers only)
  if (customerIds.length > 0) {
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select(`
        user_id,
        phone_number
      `)
      .in('user_id', customerIds);
    
    if (customerError) {
      console.error("Error fetching customers:", customerError.message);
    } else if (customerData) {
      console.log("Customer data found:", customerData.length);
      
      customerData.forEach(customer => {
        const customerId = customer.user_id;
        // Just store the phone number, we'll get names from reservations
        customerLookup[customerId] = {
          phone: customer.phone_number || 'No phone data',
          name: '' // Empty placeholder that will be filled from reservations
        };
      });
    }
  }

  // Fetch user data for staff with more details
  if (staffIds.length > 0) {
    const { data: staffData, error: staffError } = await supabase
      .from('staff')  // Changed from 'users' to 'staff'
      .select(`
        user_id,
        name,
        position,
        phone_number
      `)
      .in('user_id', staffIds);  // Using user_id as the identifier
    
    if (staffError) {
      console.error("Error fetching staff:", staffError.message);
    } else if (staffData) {
      console.log("Staff data found:", staffData.length);
      
      staffData.forEach(staff => {
        const staffId = staff.user_id;
        // Use name from staff table or fallback
        staffLookup[staffId] = staff.name || `Staff #${staffId} (${staff.position || 'Unknown position'})`;
      });
    }
  }
  
  // Fetch room data
  if (roomIds.length > 0) {
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('id, name')
      .in('id', roomIds);
      
    if (roomError) {
      console.error("Error fetching rooms:", roomError.message);
    } else if (roomData) {
      console.log("Room data found:", roomData.length);
      
      roomData.forEach(room => {
        roomLookup[room.id] = room.name || `Room #${room.id}`;
      });
    }
  }

  // Process reservations to fill in the missing customer names
  // This should happen before the "Fallback for missing data" section
  data.forEach(reservation => {
    const customerId = reservation.customer_id;
    if (customerId && reservation.customer_name) {
      // If customer exists in lookup, update the name
      if (customerLookup[customerId]) {
        customerLookup[customerId].name = reservation.customer_name;
      } 
      // Otherwise create a new entry with the name
      else {
        customerLookup[customerId] = {
          phone: 'No phone data',
          name: reservation.customer_name
        };
      }
    }
  });

  // Fallback for missing data
  data.forEach(reservation => {
    const customerId = reservation.customer_id;
    if (customerId) {
      // If customer doesn't exist in lookup yet
      if (!customerLookup[customerId]) {
        customerLookup[customerId] = {
          phone: 'No phone data',
          name: reservation.customer_name || 'Unknown Name'
        };
      } 
      // If entry exists but has no name, update it
      else if (!customerLookup[customerId].name) {
        customerLookup[customerId].name = reservation.customer_name || 'Unknown Name';
      }
    }
    
    const staffId = reservation.audited_by;
    if (staffId && !staffLookup[staffId]) {
      staffLookup[staffId] = `Staff #${staffId}`;
    }
    
    const roomId = reservation.room_id;
    if (roomId && !roomLookup[roomId]) {
      roomLookup[roomId] = `Room #${roomId}`;
    }
  });

  console.log("First reservation:", data?.[0]);
  console.log("Customer lookup entries:", Object.keys(customerLookup).length);
  console.log("Staff lookup entries:", Object.keys(staffLookup).length);
  console.log("Room lookup entries:", Object.keys(roomLookup).length);
  
  // Return the complete result object
  return {
    reservations: data || [],
    customerLookup,
    staffLookup,
    roomLookup
  };
};
