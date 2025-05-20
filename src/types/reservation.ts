// ../types/reservation.ts

export interface ReservationGuests {
  adults: number;
  children: number;
  seniors: number;
}

export interface ReservationItem {
  id: string;
  customerId: string;
  roomId: string;
  checkIn: Date;                // Should be a valid Date object
  checkOut: Date;               // Should be a valid Date object
  status: string;
  source: string;
  paymentReceived: boolean;
  guests: ReservationGuests;
  type: "online" | "direct";
  totalPrice?: number;          // Total bill (fetched from DB)
  numberOfNights: number;       // CALCULATED client-side in useReservations
  
  timestamp?: Date;             // Optional: When the reservation was created/recorded
  confirmationTime?: Date;      // Optional: When the reservation was confirmed
  notes?: string;               // Optional
  auditedBy?: string;           // Optional: ID of the staff member. If it can be missing.
                                // If it's always present as an ID string, then `auditedBy: string;`
}

export interface CustomerLookup {
  [customerId: string]: {
    customer_name_at_booking: string; 
    name: string; 
    phone: string;
  };
}

// Likely used for UI selection, not the direct structure within ReservationItem
export interface RoomOption {
  id: string;
  name: string;
  // price?: number; // Price per night, if needed during selection
}

export interface RoomLookup {
  [roomId: string]: { 
    name: string;
    price?: number; // Room rate per night (used for "Room Rate/Night" display)
  };
}

export interface StaffDetails {
  name: string;
  phone?: string; 
  role?: string; 
  // any other relevant details fetched for staff members
}

export interface StaffLookup {
  [staffId: string]: StaffDetails; // Maps staff ID to their details
}


export type ReservationType = "all" | "online" | "direct"; // For filtering or display

// These are specific status strings your application uses.
// StatusCategory might be a broader classification if needed, but often status strings are used directly.
export type StatusValue = 
  | "Pending" 
  | "Confirmed_Pending_Payment" 
  | "Accepted" 
  | "Checked_In" 
  | "Checked_Out" 
  | "Cancelled" 
  | "Rejected" 
  | "No_Show";
// And ReservationItem.status would be `status: StatusValue;` if you want strict typing.

export interface FilterOptions {
  checkInStart: string;
  checkInEnd: string;
  checkOutStart: string;
  checkOutEnd: string;
  paymentStatus: 'all' | 'paid' | 'unpaid';
  minGuests: string;
  maxGuests: string;
  roomId: string;
}