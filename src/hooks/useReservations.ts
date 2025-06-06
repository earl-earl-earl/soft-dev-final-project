// ../hooks/useReservations.ts 

import { useState, useEffect, useCallback } from "react";
import { fetchReservations } from "@/utils/fetchReservations"; 
import {
  ReservationItem,
  CustomerLookup,
  StaffLookup,
  RoomLookup,
  // StaffDetails
} from "../types/reservation";

interface UseReservationsReturn {
  reservations: ReservationItem[];
  customerLookup: CustomerLookup;
  staffLookup: StaffLookup;
  roomLookup: RoomLookup;
  isLoading: boolean;
  error: string | null;
  refreshReservations: () => Promise<void>;
  handleStatusChange: (reservationId: string, newStatus: string) => void; 
}

export const useReservations = (): UseReservationsReturn => {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [customerLookup, setCustomerLookup] = useState<CustomerLookup>({});
  const [staffLookup, setStaffLookup] = useState<StaffLookup>({});
  const [roomLookup, setRoomLookup] = useState<RoomLookup>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshReservations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // { reservations: RawReservation[], customerLookupRaw: ..., roomLookupRaw: ..., staffLookupRaw: ... }
      const result = await fetchReservations();

      if (result && result.reservations) {
        interface ReservationRaw {
          id: string | number; 
          customer_id?: string | number;
          room_id?: string | number;
          check_in?: string;     // Raw date string (e.g., "YYYY-MM-DD" or ISO)
          check_out?: string;  
          status?: string;
          confirmation_time?: string; // Raw date string
          payment_received?: boolean;
          num_adults?: number;
          num_children?: number;
          num_seniors?: number;
          audited_by?: string;   // Raw staff ID string
          source?: string;
          message?: string;
          timestamp?: string;    // Raw date string for when reservation was made
          room_price?: number;   // Price per night for the room type
          total_price?: number;  // Total final price for the stay
        }

        const formattedData: ReservationItem[] = result.reservations.map((item: ReservationRaw) => {
          // --- Date Handling ---
          const checkInDate = item.check_in ? new Date(item.check_in) : new Date(); 
          const checkOutDate = item.check_out ? new Date(item.check_out) : new Date(); 

          if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            console.warn(`Invalid check-in or check-out date for reservation ID ${item.id}. Raw: ${item.check_in}, ${item.check_out}`);
          }
          
          // --- Number of Nights Calculation ---
          let calculatedNights = 0;
          if (checkInDate && checkOutDate && !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkOutDate.getTime() > checkInDate.getTime()) {
            const start = new Date(Date.UTC(checkInDate.getUTCFullYear(), checkInDate.getUTCMonth(), checkInDate.getUTCDate()));
            const end = new Date(Date.UTC(checkOutDate.getUTCFullYear(), checkOutDate.getUTCMonth(), checkOutDate.getUTCDate()));
            const diffTime = end.getTime() - start.getTime();
            calculatedNights = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Or Math.ceil
          }

          return {
            id: String(item.id), 
            customerId: String(item.customer_id || ''),
            roomId: String(item.room_id || ''),
            checkIn: checkInDate,
            checkOut: checkOutDate,
            status: String(item.status || "Pending"),
            source: String(item.source || 'unknown'),
            paymentReceived: Boolean(item.payment_received || false),
            guests: {
              adults: Number(item.num_adults || 0),
              children: Number(item.num_children || 0),
              seniors: Number(item.num_seniors || 0),
            },
            type: item.source === "online" || item.source === "mobile" ? "online" : "direct", // Adjust "online" sources
            totalPrice: item.total_price !== undefined ? Number(item.total_price) : undefined,
            numberOfNights: calculatedNights,
            
            // Corrected timestamp handling: string to Date or undefined
            timestamp: item.timestamp ? new Date(item.timestamp) : undefined,
            confirmationTime: item.confirmation_time ? new Date(item.confirmation_time) : undefined,
            notes: item.message ? String(item.message) : undefined,
            // Corrected auditedBy handling
            auditedBy: item.audited_by ? String(item.audited_by) : undefined,
          };
        });

        // Sort by timestamp (most recent first), then by check-in if timestamps are same or missing
        formattedData.sort((a, b) => {
          const timeA = a.timestamp?.getTime() || 0;
          const timeB = b.timestamp?.getTime() || 0;
          if (timeB !== timeA) {
            return timeB - timeA;
          }
          return b.checkIn.getTime() - a.checkIn.getTime();
        });
        setReservations(formattedData);

        // --- Customer Lookup Processing ---
        if (result.customerLookup) { 
          const formattedCustomerLookup: CustomerLookup = {};
          Object.entries(result.customerLookup).forEach(([id, data]) => {
            type CustomerData = { phone?: string; name?: string; full_name?: string; customer_name_at_booking?: string };
            const cData = data as CustomerData; 
            formattedCustomerLookup[id] = {
              phone: String(cData?.phone || ''),
              name: String(cData?.name || cData?.full_name || 'Unknown'),
              customer_name_at_booking: String(cData?.customer_name_at_booking || cData?.name || cData?.full_name || 'Unknown')
            };
          });
          setCustomerLookup(formattedCustomerLookup);
        } else {
          setCustomerLookup({});
        }

        // --- Staff Lookup Processing ---
        // Assume result.staffLookupRaw is an object from fetchReservations:
        // e.g., { "staff_id_1": { name_from_db: "Alice", staff_role: "Manager" }, ... }
        // OR an array: [ {id: "staff_id_1", name_from_db: "Alice"}, ... ]
        if (result.staffLookup) {
          const formattedStaffLookup: StaffLookup = {};
          const staffData = result.staffLookup;

          if (Array.isArray(staffData)) { 
            interface StaffRaw {
              id: string | number;
              name: string;
              phone?: string;
              role?: string;
            }
            staffData.forEach((staff: StaffRaw) => {
              if (staff.id && staff.name) { 
                formattedStaffLookup[String(staff.id)] = {
                  name: String(staff.name),
                  phone: staff.phone ? String(staff.phone) : undefined,
                  role: staff.role ? String(staff.role) : undefined,
                };
              }
            });
          } else if (typeof staffData === 'object' && staffData !== null) { 
            type StaffDetailsRaw = { name?: string; phone?: string; role?: string } | string;
            Object.entries(staffData).forEach(([id, staffDetailsRaw]) => {
              const sDetails = staffDetailsRaw as StaffDetailsRaw;
              if (typeof sDetails === 'object' && sDetails !== null && 'name' in sDetails && sDetails.name) { // Check if it's an object with a name
                formattedStaffLookup[id] = {
                  name: String(sDetails.name),
                  phone: sDetails.phone ? String(sDetails.phone) : undefined,
                  role: sDetails.role ? String(sDetails.role) : undefined,
                };
              } else if (typeof sDetails === 'string') { 
                formattedStaffLookup[id] = { name: sDetails };
              }
            });
          }
          setStaffLookup(formattedStaffLookup);
        } else {
          setStaffLookup({});
        }
        
        // --- Room Lookup Processing ---
        if (result.roomLookup) { 
          const formattedRoomLookup: RoomLookup = {};
          interface RoomData {
            name?: string;
            price?: number;
          }
          Object.entries(result.roomLookup).forEach(([id, data]) => {
            const rData = data as RoomData;
            formattedRoomLookup[id] = {
              name: String(rData?.name || (typeof data === 'string' ? data : 'Unknown Room')),
              price: rData?.price !== undefined ? Number(rData.price) : undefined
            };
          });
          setRoomLookup(formattedRoomLookup);
        } else {
          setRoomLookup({});
        }

      } else {
        // Handle case where result or result.reservations is null/undefined
        setReservations([]);
        setCustomerLookup({});
        setStaffLookup({});
        setRoomLookup({});
        console.warn("fetchReservations returned no reservations or an unexpected structure.");
      }
    } catch (err) {
      console.error("Error in refreshReservations (useReservations hook):", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while loading reservations");
    } finally {
      setIsLoading(false);
    }
  }, []); 

  const handleStatusChange = useCallback((reservationId: string, newStatus: string) => {
    setReservations(prevReservations =>
      prevReservations.map(res =>
        res.id === reservationId ? { ...res, status: newStatus } : res
      )
    );
    // TODO: Persist status change to the backend
    console.log(`Reservation ${reservationId} status (optimistically) updated to ${newStatus}`);
  }, []); 

  useEffect(() => {
    refreshReservations();
  }, [refreshReservations]); 

  return {
    reservations,
    customerLookup,
    staffLookup,
    roomLookup,
    isLoading,
    error,
    refreshReservations,
    handleStatusChange
  };
};