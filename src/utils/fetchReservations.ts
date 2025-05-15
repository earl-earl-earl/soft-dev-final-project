import { supabase } from "@/lib/supabaseClient";

export const fetchReservations = async () => {
  // First, let's check the actual schema of the customers table
  const { data: customerFields, error: schemaError } = await supabase
    .from('customers')
    .select('*')
    .limit(1);
  
  if (schemaError) {
    console.error("Error checking customer schema:", schemaError.message);
  } else {
    console.log("Customer table fields:", Object.keys(customerFields[0] || {}));
  }

  // Now fetch reservations with the correct field names
  const { data, error } = await supabase
    .from("reservations")
    .select(`
      id,
      customer_id,
      customer_name,
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
      audited_by,
      customers:customer_id (
        user_id,
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

  console.log("First reservation:", data?.[0]);
  return data;
};
