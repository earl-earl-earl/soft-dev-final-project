import { supabase } from "@/lib/supabaseClient";

export const fetchReservations = async () => {
  const { data, error } = await supabase
    .from("reservations")
    .select(`
      id,
      customer_id,
      room_id,
      check_in,
      check_out,
      num_adults,
      num_children,
      num_seniors,
      status,
      confirmation_time,
      payment_received,
      source,
      message,
      type,
      audited_by,
      customers (
        name,
        phone_number
      ),
      staff:audited_by (
        name
      )
    `);

  if (error) {
    console.error("Error fetching reservations:", error.message);
    return [];
  }

  return data;
};
