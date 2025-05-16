export interface ReservationGuests {
  adults: number;
  children: number;
  seniors: number;
}

export interface ReservationItem {
  timestamp: Date;
  id: string;
  customerId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: string;
  confirmationTime?: Date;
  paymentReceived: boolean;
  guests: ReservationGuests;
  auditedBy?: string;
  type: "online" | "direct";
  notes?: string;
}

export interface CustomerLookup {
  [key: string]: {
    customer_name_at_booking: string; 
    name: string; 
    phone: string;
  };
}

export interface RoomOption {
  id: string;
  name: string;
}

export interface RoomLookup {
  [key: string]: { 
    name: string;
  };
}

export interface StaffLookup {
  [key: string]: string;
}

export type ReservationType = "all" | "online" | "direct";
export type StatusCategory = "Accepted" | "Pending" | "Cancelled" | "Rejected" | "Expired" | "Confirmed_Pending_Payment";

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