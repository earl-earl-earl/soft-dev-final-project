// contexts/newReservation.ts (or your file location)

import { supabase } from "@/lib/supabaseClient";
// 1. CRITICAL: VERIFY THIS IMPORT PATH.
// Ensure ReservationData imported from here includes calculatedPrice and numberOfNights.
import { ReservationData } from "../../components/overlay_components/NewReservationOverlay";
import { v4 as uuidv4 } from "uuid";

export const submitReservation = async (formData: ReservationData) => {
  try {
    console.log("SUBMIT_RESERVATION: Function started. Processing reservation for:", formData.name);

    // ** FormData Values Check (critical for price and nights) **
    console.log(
      "SUBMIT_RESERVATION: formData values from overlay: " +
      `calculatedPrice: ${formData.calculatedPrice} (Type: ${typeof formData.calculatedPrice}), ` +
      `numberOfNights: ${formData.numberOfNights} (Type: ${typeof formData.numberOfNights}), ` +
      `checkIn: ${formData.checkIn.toISOString()}, checkOut: ${formData.checkOut.toISOString()}, ` +
      `room ID: ${formData.room}`
    );

    // Validate calculatedPrice (now definitely expected from the overlay)
    if (typeof formData.calculatedPrice !== 'number' || isNaN(formData.calculatedPrice)) {
      console.error("SUBMIT_RESERVATION: Invalid calculatedPrice received from overlay. Value:", formData.calculatedPrice);
      throw new Error("Calculated price is invalid. Please check the room price and dates in the form.");
    }

    // Validate numberOfNights (primarily used for client-side price calculation and as a cross-check here)
    if (typeof formData.numberOfNights !== 'number' || isNaN(formData.numberOfNights) || formData.numberOfNights < 0) {
        console.warn("SUBMIT_RESERVATION: Invalid numberOfNights received from overlay. Value:", formData.numberOfNights, "This doesn't stop submission but indicates a potential issue.");
        // If numberOfNights is 0 or less, calculatedPrice should ideally be 0 unless there's a base fee.
        if (formData.numberOfNights <= 0 && formData.calculatedPrice > 0) {
            console.warn("SUBMIT_RESERVATION: numberOfNights is <= 0, but calculatedPrice is > 0. This might indicate a calculation discrepancy in the overlay.");
        }
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.error("SUBMIT_RESERVATION: Session error or no user:", sessionError);
      throw new Error("Unable to get current staff user session.");
    }
    const staffId = session.user.id;
    console.log("SUBMIT_RESERVATION: Staff ID:", staffId);

    let customerId: string;

    // Step 1: Check if customer already exists by phone number
    console.log("SUBMIT_RESERVATION: Looking up customer by phone:", formData.phone);
    const { data: existingCustomer, error: customerLookupError } =
      await supabase
        .from("customers")
        .select("id")
        .eq("phone_number", formData.phone)
        .single();

    if (customerLookupError && customerLookupError.code !== "PGRST116") { // PGRST116: no rows found
      console.error("SUBMIT_RESERVATION: Customer lookup error:", customerLookupError);
      throw new Error(`Failed to lookup customer: ${customerLookupError.message}`);
    }

    // Step 2: If not found, insert new customer
    if (existingCustomer) {
      customerId = existingCustomer.id;
      console.log("SUBMIT_RESERVATION: Existing customer found. ID:", customerId);
    } else {
      customerId = uuidv4();
      console.log("SUBMIT_RESERVATION: No existing customer. Creating new one with ID:", customerId, "Name:", formData.name);
      const { error: insertCustomerError } = await supabase
        .from("customers")
        .insert({
          id: customerId,
          email: null, // Assuming direct bookings may not have email from form
          full_name: formData.name,
          phone_number: formData.phone,
          is_email_confirmed: false,
        });

      if (insertCustomerError) {
        console.error("SUBMIT_RESERVATION: Insert customer error:", insertCustomerError);
        throw new Error(`Failed to create customer: ${insertCustomerError.message}`);
      }
      console.log("SUBMIT_RESERVATION: New customer created successfully.");
    }

    // Step 3: Prepare and Insert reservation
    // formData.room is the room ID (string) from RoomOption.id
    const roomIdString = formData.room;
    // If your 'reservations.room_id' column is type INTEGER, you would need to convert and validate:
    // const roomIdNumber = Number(formData.room);
    // if (isNaN(roomIdNumber)) {
    //   console.error("SUBMIT_RESERVATION: Invalid Room ID for DB (not a number):", formData.room);
    //   throw new Error("Room ID is invalid – ensure it's a number if DB requires it.");
    // }

    const reservationPayload = {
      customer_id: customerId,
      customer_name_at_booking: formData.name,
      customer_email_at_booking: null, // Modify if email is collected in the form
      customer_phone_at_booking: formData.phone,
      // VERIFY: Ensure 'reservations.room_id' column type matches roomIdString (e.g., TEXT, UUID)
      room_id: roomIdString, // Use roomIdString or roomIdNumber depending on your DB schema for room_id
      check_in: formData.checkIn.toISOString().split("T")[0], // Format YYYY-MM-DD
      check_out: formData.checkOut.toISOString().split("T")[0], // Format YYYY-MM-DD
      num_adults: formData.adults,
      num_children: formData.children,
      num_seniors: formData.seniors,
      status: "Confirmed_Pending_Payment", // Default status
      source: "staff_manual", // Aligns with overlay's 'direct' type
      message: formData.notes,
      payment_received: false,
      audited_by: staffId,
      timestamp: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      status_updated_at: new Date().toISOString(),
      
      // --- PRICE ---
      // VERIFY: Ensure 'reservations.total_price' column exists and can store this numeric value.
      total_price: formData.calculatedPrice,
      
      // --- NUMBER OF NIGHTS (Optional to store in reservations table) ---
      // The actual number of nights is derived from reserved_dates.
      // Uncomment if you have a 'number_of_nights' column in your 'reservations' table.
      // number_of_nights: formData.numberOfNights, 
    };
    
    console.log("SUBMIT_RESERVATION: Attempting to insert reservation with payload:", JSON.stringify(reservationPayload, null, 2));

    const { data: reservationRow, error: insertReservationError } =
      await supabase
        .from("reservations")
        .insert(reservationPayload)
        .select("id")
        .single();

    if (insertReservationError) {
      console.error("SUBMIT_RESERVATION: Reservation insert error details:", insertReservationError);
      let userMessage = `Failed to insert reservation: ${insertReservationError.message}`;
      if (insertReservationError.message.includes("violates foreign key constraint")) {
        if (insertReservationError.message.includes("room_id")) {
            userMessage = "Failed to insert reservation: The selected room ID is invalid or does not exist. Please refresh available rooms and try again.";
        } else if (insertReservationError.message.includes("customer_id")) {
            userMessage = "Failed to insert reservation: Customer ID issue. Please try again.";
        }
      }
      throw new Error(userMessage);
    }

    if (!reservationRow || !reservationRow.id) {
      console.error("SUBMIT_RESERVATION: Reservation inserted but ID was not returned. This is unexpected.");
      throw new Error("Reservation created, but couldn't confirm details. Please check the reservations list.");
    }
    const reservationId = reservationRow.id;
    console.log("SUBMIT_RESERVATION: Reservation inserted successfully. ID:", reservationId);

    // Step 4: Insert reserved_dates for each night
    const reservedDates: {
      reservation_id: typeof reservationId;
      room_id: typeof roomIdString; // Match type used in reservationPayload
      date: string;
    }[] = [];

    // Use UTC dates for consistent date-only operations
    const currentDate = new Date(Date.UTC(formData.checkIn.getUTCFullYear(), formData.checkIn.getUTCMonth(), formData.checkIn.getUTCDate()));
    const endDate = new Date(Date.UTC(formData.checkOut.getUTCFullYear(), formData.checkOut.getUTCMonth(), formData.checkOut.getUTCDate()));

    console.log("SUBMIT_RESERVATION: Generating reserved_dates. Start (UTC):", currentDate.toISOString(), "End (UTC):", endDate.toISOString());

    while (currentDate.getTime() < endDate.getTime()) {
      reservedDates.push({
        reservation_id: reservationId,
        room_id: roomIdString, // Match type
        date: currentDate.toISOString().split("T")[0], // Format YYYY-MM-DD
      });
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    console.log(
        `SUBMIT_RESERVATION: Number of reserved_dates generated (server-calculated nights): ${reservedDates.length}. ` +
        `Client-calculated numberOfNights from overlay: ${formData.numberOfNights}.`
    );
    // Assert or log warning if reservedDates.length !== formData.numberOfNights
    if (reservedDates.length !== formData.numberOfNights && formData.numberOfNights > 0) { // formData.numberOfNights can be 0 if dates are same
        console.warn(`SUBMIT_RESERVATION: Mismatch between server-calculated nights (${reservedDates.length}) and client-calculated nights (${formData.numberOfNights}). Using server calculation for reserved_dates table.`);
    }


    if (reservedDates.length > 0) {
      console.log("SUBMIT_RESERVATION: Inserting reserved_dates:", JSON.stringify(reservedDates, null, 2));
      // VERIFY: Ensure 'reserved_dates' is your table name
      const { error: insertDatesError } = await supabase
        .from("reserved_dates") 
        .insert(reservedDates);

      if (insertDatesError) {
        console.error("SUBMIT_RESERVATION: Insert reserved_dates error:", insertDatesError);
        // Consider rollback or marking reservation as problematic
        throw new Error(
          `Reservation created (ID: ${reservationId}), but failed to mark dates as reserved: ${insertDatesError.message}. Please check manually.`
        );
      }
      console.log("SUBMIT_RESERVATION: reserved_dates inserted successfully.");
    } else if (formData.numberOfNights > 0) { // Only warn if client thought there were nights
      console.warn("SUBMIT_RESERVATION: No reserved_dates were generated to insert for reservation ID:", reservationId," despite client expecting", formData.numberOfNights, "nights. Check date logic if this is an error.");
    } else {
      console.log("SUBMIT_RESERVATION: No nights to reserve (e.g., check-in and check-out might be same day, or error in dates). No reserved_dates inserted.");
    }

    return { success: true, reservationId: reservationId };

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err) || "Unknown error during reservation submission");
    console.error("SUBMIT_RESERVATION: Reservation submission failed globally. Error:", error.message, "\nFormData at time of error:", JSON.stringify(formData, null, 2), "\nStack:", error.stack);
    return { success: false, message: error.message };
  }
};