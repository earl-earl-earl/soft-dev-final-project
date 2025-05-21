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
  checkIn: Date;             
  checkOut: Date;              
  status: string;
  source: string;
  paymentReceived: boolean;
  guests: ReservationGuests;
  type: "online" | "direct";
  totalPrice?: number;          
  numberOfNights: number;     
  
  timestamp?: Date;          
  confirmationTime?: Date;     
  notes?: string;             
  auditedBy?: string;      
                             
}

export interface CustomerLookup {
  [customerId: string]: {
    customer_name_at_booking: string; 
    name: string; 
    phone: string;
  };
}

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
}

export interface StaffLookup {
  [staffId: string]: StaffDetails; // Maps staff ID to their details
}


export type ReservationType = "all" | "online" | "direct"; 

// These are specific status strings your application uses.
export type StatusValue = 
  | "Pending" 
  | "Confirmed_Pending_Payment" 
  | "Accepted" 
  | "Checked_In" 
  | "Checked_Out" 
  | "Cancelled" 
  | "Rejected" 
| "No_Show"
| "Expired";

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