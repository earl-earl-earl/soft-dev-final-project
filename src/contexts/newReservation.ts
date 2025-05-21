// contexts/newReservation.ts

import { supabase } from "@/lib/supabaseClient";
import { ReservationData } from "../../components/overlay_components/NewReservationOverlay"; 
import { formatDateForDB } from '@/utils/dateUtils'; 

// --- Configuration Constants ---
const MAX_RESERVATION_DAYS_CONFIG = 7; // Max stay of 7 days
const PH_MOBILE_REGEX = /^(09\d{9}|9\d{9})$/; // For 11-digit PH mobile: 09xxxxxxxxx or 9xxxxxxxxx
const CAPACITY_ALLOWANCE_SERVER = 2; 

export const submitReservation = async (formData: ReservationData) => {
  console.log("SUBMIT_RESERVATION: Initiated. Guest:", formData.name, "Data Snapshot:", JSON.stringify(formData, (key, value) => {
    if (value instanceof Date) { return value.toLocaleString(); } 
    return value;
  }));

  try {
    // --- Comprehensive Input Validation (Server-side gatekeeping) ---
    if (!formData.name?.trim()) throw new Error("Guest name is required.");
    if (!formData.room) throw new Error("Room selection is required."); // formData.room is room ID string
    
    const trimmedPhone = formData.phone.trim();
    if (!trimmedPhone) throw new Error("Phone number is required.");
    if (!PH_MOBILE_REGEX.test(trimmedPhone)) {
        throw new Error('Please enter a valid 11-digit PH mobile number (e.g., 09171234567 or 9171234567).');
    }

    if (typeof formData.adults !== 'number' || formData.adults < 1) {
        throw new Error("At least one adult is required for the reservation.");
    }
    // Ensure children and seniors are non-negative numbers
    if (typeof formData.children !== 'number' || formData.children < 0) throw new Error("Children count cannot be negative.");
    if (typeof formData.seniors !== 'number' || formData.seniors < 0) throw new Error("Seniors count cannot be negative.");


    if (typeof formData.calculatedPrice !== 'number' || isNaN(formData.calculatedPrice) || formData.calculatedPrice < 0) {
      console.error("SUBMIT_RESERVATION: Invalid calculatedPrice. Value:", formData.calculatedPrice);
      throw new Error("Calculated price is invalid or negative. Please verify room rates and dates.");
    }
    
    // Date Validation
    if (!(formData.checkIn instanceof Date) || !(formData.checkOut instanceof Date) || 
        isNaN(formData.checkIn.getTime()) || isNaN(formData.checkOut.getTime())) {
        throw new Error("Invalid check-in or check-out date objects were provided from the form.");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight for accurate date-only comparison

    // Normalize input dates to midnight local time for consistent day calculations
    const localCheckInDate = new Date(formData.checkIn.getFullYear(), formData.checkIn.getMonth(), formData.checkIn.getDate());
    const localCheckOutDate = new Date(formData.checkOut.getFullYear(), formData.checkOut.getMonth(), formData.checkOut.getDate());

    if (localCheckInDate.getTime() < today.getTime()) {
        throw new Error("Check-in date cannot be in the past.");
    }
    if (localCheckOutDate.getTime() <= localCheckInDate.getTime()) {
        throw new Error("Check-out date must be chronologically after the check-in date.");
    }

    // Calculate nights based on server's interpretation of local calendar days
    const durationInMs = localCheckOutDate.getTime() - localCheckInDate.getTime();
    const serverCalculatedNights = Math.ceil(durationInMs / (1000 * 60 * 60 * 24)); 
    
    if (serverCalculatedNights <= 0) { // This implies checkIn >= checkOut if dates were valid
        console.error("SUBMIT_RESERVATION: Server calculated 0 or negative nights. Check-in:", localCheckInDate, "Check-out:", localCheckOutDate);
        throw new Error("Reservation must be for at least one night.");
    }
    if (serverCalculatedNights > MAX_RESERVATION_DAYS_CONFIG) {
        throw new Error(`Reservation duration (${serverCalculatedNights} nights) cannot exceed ${MAX_RESERVATION_DAYS_CONFIG} days.`);
    }
    if (serverCalculatedNights !== formData.numberOfNights && formData.numberOfNights >= 0) {
        console.warn(`SUBMIT_RESERVATION: Night count mismatch. Server calculated: ${serverCalculatedNights}, Client sent: ${formData.numberOfNights}. Using server calculation for reserved_dates.`);
    }
    
    // --- Session ---
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user?.id) { 
        console.error("SUBMIT_RESERVATION: Session error or no user:", sessionError?.message || "No session/user ID.");
        throw new Error("Unable to verify staff session. Please log in again."); 
    }
    const staffId = session.user.id;
    // console.log("SUBMIT_RESERVATION: Authenticated Staff ID:", staffId);

    // --- Fetch Selected Room Details (for capacity and active status validation) ---
    const roomIdString = formData.room;
    console.log(`SUBMIT_RESERVATION: Fetching details for selected room ID: ${roomIdString}`);
    type RoomData = { id: string; name: string; capacity: number; is_active: boolean };
    const { data, error: roomFetchError } = await supabase
      .from('rooms')
      .select('id, name, capacity, is_active') 
      .eq('id', roomIdString)
      .single();

    const selectedRoomData = data as RoomData | null;

    if (roomFetchError) {
      console.error("SUBMIT_RESERVATION: Error fetching selected room details:", roomFetchError.message, roomFetchError.details);
      throw new Error(`Could not retrieve details for the selected room (${selectedRoomData?.name || roomIdString}). Please try selecting the room again or contact support.`);
    }
    if (!selectedRoomData) {
      throw new Error(`The selected room (ID: ${roomIdString}) could not be found. It may have been recently removed.`);
    }
    if (!selectedRoomData.is_active) {
      throw new Error(`The selected room "${selectedRoomData.name}" is currently not active or available for booking.`);
    }
    
    const baseRoomCapacity = selectedRoomData.capacity;
    if (typeof baseRoomCapacity !== 'number' || baseRoomCapacity <= 0) { // Capacity must be a positive number
        console.error(`SUBMIT_RESERVATION: Room ${roomIdString} ("${selectedRoomData.name}") has an invalid or zero capacity defined (${baseRoomCapacity}).`);
        throw new Error(`The selected room "${selectedRoomData.name}" does not have a valid guest capacity defined. Please contact administration.`);
    }
    const maxAllowedWithServerAllowance = baseRoomCapacity + CAPACITY_ALLOWANCE_SERVER;

    // --- SERVER-SIDE Occupant Validation (against room capacity + ALLOWANCE) ---
    const totalOccupants = (Number(formData.adults) || 0) + (Number(formData.children) || 0) + (Number(formData.seniors) || 0);
    
    if (totalOccupants > maxAllowedWithServerAllowance) { 
        throw new Error(`Number of guests (${totalOccupants}) exceeds the maximum allowed (${maxAllowedWithServerAllowance}) for room "${selectedRoomData.name}".`);
    }
    
    // If totalOccupants is within allowance (totalOccupants > baseRoomCapacity && totalOccupants <= maxAllowedWithServerAllowance)
    // The client-side NewReservationOverlay should have already validated that 'notes' are present.
    if (totalOccupants > baseRoomCapacity && !formData.notes?.trim()) {
        console.warn(`SUBMIT_RESERVATION: Guest count (${totalOccupants}) is over base room capacity (${baseRoomCapacity}) for "${selectedRoomData.name}", and notes are empty on server-side. Client-side validation for notes might have been bypassed or is insufficient for this allowance.`);
        throw new Error(`Notes are required when exceeding base room capacity of ${baseRoomCapacity} to accommodate ${totalOccupants} guests. Please provide details in the notes section.`);
    }
    console.log(`SUBMIT_RESERVATION: Occupant count ${totalOccupants} for room "${selectedRoomData.name}" (BaseCap: ${baseRoomCapacity}, Allow: ${CAPACITY_ALLOWANCE_SERVER}, MaxAllowed: ${maxAllowedWithServerAllowance}) is acceptable.`);


    // --- Customer Handling ---
    let customerIdToUse: string;
    const { data: existingCustomer, error: customerLookupError } = await supabase
      .from("customers").select("id").eq("phone_number", trimmedPhone).single();
    if (customerLookupError && customerLookupError.code !== "PGRST116") { throw new Error(`Customer lookup failed: ${customerLookupError.message}`); }
    if (existingCustomer) {
      customerIdToUse = existingCustomer.id;
    } else {
      const { data: newCustomer, error: insertCustomerError } = await supabase
        .from("customers").insert({ full_name: formData.name.trim(), phone_number: trimmedPhone, is_email_confirmed: false })
        .select("id").single();
      if (insertCustomerError) { throw new Error(`Failed to create customer: ${insertCustomerError.message}`); }
      if (!newCustomer?.id) { throw new Error("Failed to get ID for new customer."); }
      customerIdToUse = String(newCustomer.id);
    }

    // --- Date Formatting for DB ---
    const checkInForDB = formatDateForDB(localCheckInDate);
    const checkOutForDB = formatDateForDB(localCheckOutDate);
    if (!checkInForDB || !checkOutForDB) {
        console.error("SUBMIT_RESERVATION: Date formatting unexpectedly failed just before payload creation.");
        throw new Error("Internal error: Date formatting failed."); 
    }

    // --- FINAL ROOM AVAILABILITY CHECK (against other Confirmed/Accepted/CheckedIn bookings) ---
    console.log(`SUBMIT_RESERVATION: Performing final availability check for Room ID: ${roomIdString} between ${checkInForDB} and ${checkOutForDB}`);
    const { data: conflictingReservations, error: availabilityError } = await supabase
      .from('reservations')
      .select('id') 
      .eq('room_id', roomIdString)
      .in('status', ['Confirmed_Pending_Payment', 'Accepted', 'Checked_In']) 
      .lt('check_in', checkOutForDB) 
      .gt('check_out', checkInForDB); 
      
    if (availabilityError) { 
        console.error("SUBMIT_RESERVATION: DB error during availability check:", availabilityError.message, availabilityError.details);
        throw new Error("Could not verify room availability due to a system error. Please try again."); 
    }
    if (conflictingReservations && conflictingReservations.length > 0) {
      console.warn("SUBMIT_RESERVATION: Availability conflict. Room already booked by:", conflictingReservations);
      throw new Error("Selected dates for this room are unavailable due to an existing confirmed or held reservation.");
    }
    console.log("SUBMIT_RESERVATION: Room availability check passed (no hard conflicts).");

    // --- Reservation Payload ---
    const reservationPayload = {
      customer_id: customerIdToUse,
      customer_name_at_booking: formData.name.trim(),
      customer_phone_at_booking: trimmedPhone,
      room_id: roomIdString,
      check_in: checkInForDB,
      check_out: checkOutForDB,
      num_adults: Number(formData.adults) || 0,
      num_children: Number(formData.children) || 0,
      num_seniors: Number(formData.seniors) || 0,
      status: "Confirmed_Pending_Payment", 
      source: "staff_manual", 
      message: formData.notes.trim(), // Notes are included
      payment_received: false,
      audited_by: staffId,
      total_price: formData.calculatedPrice,
      // number_of_nights: OMITTED (not in DB schema)
      // Timestamps like 'timestamp', 'confirmation_time', 'last_updated', 'status_updated_at'
      // are OMITTED to allow database DEFAULT now() to set them on INSERT for this new record.
    };
    
    console.log("SUBMIT_RESERVATION: Attempting to insert reservation payload:", JSON.stringify(reservationPayload, null, 2));
    const { data: reservationRow, error: insertReservationError } = await supabase
        .from("reservations").insert(reservationPayload).select("id").single();

    if (insertReservationError) { 
        console.error("SUBMIT_RESERVATION: Error inserting reservation record:", insertReservationError.message, insertReservationError.details);
        throw new Error(`Reservation insert failed: ${insertReservationError.message}`);
    }
    if (!reservationRow?.id) { 
        console.error("SUBMIT_RESERVATION: Reservation inserted, but ID was not returned from DB.");
        throw new Error("Reservation created, but failed to retrieve confirmation ID.");
    }
    const reservationId = String(reservationRow.id);
    console.log("SUBMIT_RESERVATION: Reservation successfully inserted. New Reservation ID:", reservationId);

    // --- Reserved Dates Insertion ---
    const reservedDates: { reservation_id: string; room_id: string; date: string; }[] = [];
    if (serverCalculatedNights > 0) {
        const currentIteratingDate = new Date(localCheckInDate.getTime());
        for (let i = 0; i < serverCalculatedNights; i++) {
            const dateForDbLoop = formatDateForDB(currentIteratingDate);
            if (!dateForDbLoop) { 
                console.warn("SUBMIT_RESERVATION: Skipping date in reserved_dates loop due to formatting error:", currentIteratingDate.toLocaleDateString());
                currentIteratingDate.setDate(currentIteratingDate.getDate() + 1);
                continue; 
            }
            reservedDates.push({ reservation_id: reservationId, room_id: roomIdString, date: dateForDbLoop });
            currentIteratingDate.setDate(currentIteratingDate.getDate() + 1);
        }
    }

    if (reservedDates.length > 0) {
      console.log(`SUBMIT_RESERVATION: Attempting to insert ${reservedDates.length} reserved_dates entries.`);
      const { error: insertDatesError } = await supabase.from("reserved_dates").insert(reservedDates);
      if (insertDatesError) { 
          console.error("SUBMIT_RESERVATION: Critical error inserting into reserved_dates:", insertDatesError.message, insertDatesError.details);
          throw new Error(`Reservation (ID: ${reservationId}) created, BUT FAILED to block room dates: ${insertDatesError.message}. URGENT: This requires manual correction to prevent overbooking.`);
      }
      console.log("SUBMIT_RESERVATION: reserved_dates entries successfully inserted.");
    } else if (serverCalculatedNights > 0) { 
        console.error(`SUBMIT_RESERVATION: CRITICAL LOGIC FLAW - serverCalculatedNights was ${serverCalculatedNights} but no reserved_dates were generated for reservation ${reservationId}.`);
        throw new Error("Internal error: Failed to generate reservable night entries despite a positive stay duration. Please contact support.");
    } else {
      console.log("SUBMIT_RESERVATION: No nights to reserve (0 serverCalculatedNights), so no reserved_dates entries were created.");
    }

    console.log("SUBMIT_RESERVATION: Reservation process completed successfully for ID:", reservationId);
    return { success: true, reservationId: reservationId };

  } catch (err: unknown) { 
    const error = err instanceof Error ? err : new Error(String(err) || "Unknown error during reservation submission process.");
    const formDataString = typeof formData !== 'undefined' 
        ? JSON.stringify(formData, (key, value) => (value instanceof Date ? value.toISOString() : value), 2) 
        : "formData was not available at the point of error.";
    console.error(
        "SUBMIT_RESERVATION: Global error caught during submission.\n",
        "Error Message:", error.message, "\n",
        "FormData (at time of error):", formDataString, "\n",
        "Stack Trace (if available):", error.stack
    );
    return { success: false, message: error.message };
  }
};