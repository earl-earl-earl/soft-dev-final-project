import { useState, useEffect, useCallback } from "react";
import { fetchReservations } from "@/utils/fetchReservations";
import { 
  ReservationItem, 
  CustomerLookup, 
  StaffLookup, 
  RoomLookup 
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

  const refreshReservations = async () => {
    setIsLoading(true);
    try {
      const result = await fetchReservations();
      
      if (result && result.reservations) {
        const formattedData: ReservationItem[] = result.reservations.map((item: any) => ({
          id: String(item.id || ''),
          customerId: String(item.customer_id || ''),
          roomId: String(item.room_id || ''),
          checkIn: item.check_in ? new Date(item.check_in) : new Date(),
          checkOut: item.check_out ? new Date(item.check_out) : new Date(),
          status: String(item.status || "Pending"),
          confirmationTime: item.confirmation_time ? new Date(item.confirmation_time) : undefined,
          paymentReceived: Boolean(item.payment_received || false),
          guests: {
            adults: Number(item.num_adults || 0),
            children: Number(item.num_children || 0),
            seniors: Number(item.num_seniors || 0),
          },
          auditedBy: item.audited_by ? String(item.audited_by) : undefined,
          type: item.source === "online" ? "online" : "direct",
          notes: item.message ? String(item.message) : undefined,
        }));
        
        formattedData.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());
        setReservations(formattedData);
        
        // Set the lookup tables
        if (result.customerLookup) {
          // Transform customerLookup to ensure it has the expected structure
          const formattedCustomerLookup: CustomerLookup = {};
          Object.entries(result.customerLookup).forEach(([id, data]) => {
            formattedCustomerLookup[id] = {
              phone: typeof data === 'object' && 'phone' in data ? data.phone : '',
              name: typeof data === 'object' && 'name' in data ? String(data.name) : 'Unknown'
            };
          });
          setCustomerLookup(formattedCustomerLookup);
        }
        
        if (result.staffLookup) {
          setStaffLookup(result.staffLookup);
        }
        
        if (result.roomLookup) {
          // Transform roomLookup to ensure it has the expected structure
          const formattedRoomLookup: RoomLookup = {};
          Object.entries(result.roomLookup).forEach(([id, data]) => {
            formattedRoomLookup[id] = {
              name: typeof data === 'object' && data !== null && 'name' in data 
                ? String((data as {name: string}).name) 
                : String(data)
            };
          });
          setRoomLookup(formattedRoomLookup);
        }
      } else {
        setReservations([]);
      }
      setError(null);
    } catch (err) {
      console.error("Error loading reservations:", err);
      setError(err instanceof Error ? err.message : "Failed to load reservations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = useCallback((reservationId: string, newStatus: string) => {
    // Find the reservation to update
    const reservationToUpdate = reservations.find(res => res.id === reservationId);
    if (!reservationToUpdate) {
      console.error(`Reservation ${reservationId} not found.`);
      alert(`Error: Reservation ${reservationId} not found.`);
      return;
    }

    // Optimistic UI update
    const updatedReservations = reservations.map(res =>
      res.id === reservationId ? { ...res, status: newStatus } : res
    );
    setReservations(updatedReservations);

    // TODO: Implement API call to update status in the backend
    console.log(`Reservation ${reservationId} status (optimistically) updated to ${newStatus}`);
  }, [reservations]);

  useEffect(() => {
    refreshReservations();
  }, []);

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