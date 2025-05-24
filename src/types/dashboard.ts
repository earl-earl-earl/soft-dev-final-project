export interface RoomStats {
  totalRooms: number;
  totalRoomsChange: number;
  occupied: number;
  occupiedChange: number;
  available: number;
  availableChange: number;
}

export interface RoomData {
  id: string;
  name: string;
  capacity: number;
  room_price: number;
  status: "Occupied" | "Vacant";
  occupant?: { name: string };
}

export interface ReservationStats {
  checkIns: string;
  checkOuts: string;
  totalGuests: string;
  occupancyRate: string;
}

export interface ReservationData {
  id: string;
  name: string;
  room: string;
  checkIn: string;
  status: string;
}

export interface StaffData {
  id: string;
  username: string;
  name: string;
  position: string;
}

export interface AdminData extends StaffData {
  id: string;
  username: string;
  name: string;
  position: string;
}