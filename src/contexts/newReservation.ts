import { supabase } from "@/lib/supabaseClient";
import { ReservationData } from "../../components/overlay_components/NewReservationOverlay";

const {
  data: { session },
  error: sessionError
} = await supabase.auth.getSession();

const staffId = session?.user?.id;

if (!staffId) throw new Error("Unable to get current staff user.");


export const submitReservation = async (formData: ReservationData) => {
  try {
    let customerId: string;

    // Step 1: Check if customer already exists based on phone number
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("user_id")
      .eq("phone_number", formData.phone)
      .single();

    // Step 2: If not found, insert into users + customers
    if (existingCustomer) {
      customerId = existingCustomer.user_id;
    } else {
      const { data: newUserRow, error: insertUserError } = await supabase
        .from("users")
        .insert({ role: "customer" })
        .select("id")
        .single();

      if (insertUserError || !newUserRow) throw new Error("Failed to create user");

      customerId = newUserRow.id;

      const { error: insertCustomerError } = await supabase
        .from("customers")
        .insert({
          user_id: customerId,
          phone_number: formData.phone,

        });

      if (insertCustomerError) throw new Error("Failed to create customer");
    }

    // Step 3: Insert reservation
    const { data: reservationRow, error: insertReservationError } = await supabase
    .from("reservations")
    .insert({
      customer_id: customerId,
      customer_name: formData.name,
      room_id: Number(formData.room),
      check_in: formData.checkIn.toISOString().split("T")[0],
      check_out: formData.checkOut.toISOString().split("T")[0],
      num_adults: formData.adults,
      num_children: formData.children,
      num_seniors: formData.seniors,
      status: "Confirmed_Pending_Payment",
      source: "staff_manual",
      message: formData.notes,
      payment_received: false,
      audited_by: staffId,                          // ✅ Insert current staff user
      status_updated_at: new Date().toISOString(),  // ✅ Optional timestamp
    })
    .select("id")
    .single();
  

    if (insertReservationError || !reservationRow)
      throw new Error("Failed to insert reservation");

    const reservationId = reservationRow.id;

    // Step 4: Insert reserved_dates for each night in the range
    const reservedDates: { reservation_id: number; room_id: number; date: string }[] = [];
    const current = new Date(formData.checkIn);

    while (current < formData.checkOut) {
      reservedDates.push({
        reservation_id: reservationId,
        room_id: Number(formData.room),
        date: current.toISOString().split("T")[0],
      });
      current.setDate(current.getDate() + 1);
    }

    const { error: insertDatesError } = await supabase
      .from("reserved_dates")
      .insert(reservedDates);

    if (insertDatesError) throw new Error("Failed to insert reserved dates");

    return { success: true };

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error("Unknown error");
    console.error("Reservation failed:", error.message);
    return { success: false, message: error.message };
  }
};
