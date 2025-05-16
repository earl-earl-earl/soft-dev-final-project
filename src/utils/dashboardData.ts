import { 
  RoomStats, 
  RoomData, 
  ReservationStats, 
  ReservationData,
  StaffData,
  AdminData
} from '../types/dashboard';

export const getMockDashboardData = () => {
  const roomStats: RoomStats = {
    totalRooms: 19,
    totalRoomsChange: 30,
    occupied: 9,
    occupiedChange: -8,
    available: 10,
    availableChange: 69,
  };

  const recentRooms: RoomData[] = [
    {
      id: "001",
      name: "Emil",
      capacity: 4,
      price: 3500.0,
      status: "Occupied",
      occupant: { name: "Lozada, Daven J." },
    },
    {
      id: "002",
      name: "Ohana",
      capacity: 2,
      price: 2000.0,
      status: "Occupied",
      occupant: { name: "Segura, Paul J." },
    },
    {
      id: "003",
      name: "Kyle",
      capacity: 6,
      price: 5000.0,
      status: "Vacant",
    },
  ];

  const reservationStats: ReservationStats = {
    checkIns: "32",
    checkOuts: "29", 
    totalGuests: "24",
    occupancyRate: "63%",
  };

  const recentReservations: ReservationData[] = [
    {
      id: "A1701",
      name: "Lozada, Daven Jerthrude",
      room: "Resthouse",
      checkIn: "May 05, 2025",
      status: "Accepted",
    },
    {
      id: "A1189",
      name: "Ledesma, Marben Jhon",
      room: "Ohana",
      checkIn: "May 06, 2025",
      status: "Accepted",
    },
    {
      id: "A1669",
      name: "Rafael, Earl John",
      room: "Camille",
      checkIn: "May 02, 2025",
      status: "Accepted",
    },
  ].sort((a, b) => {
    return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
  });

  const recentStaff: StaffData[] = [
    {
      id: "id-1",
      username: "user1",
      name: "Name 1",
      position: "Staff",
    },
    {
      id: "id-2",
      username: "user2",
      name: "Name 2",
      position: "Staff",
    },
    {
      id: "id-3",
      username: "user3",
      name: "Name 3",
      position: "Staff",
    },
  ];

  const recentAdmins: AdminData[] = [
    {
      id: "id-1",
      username: "admin1",
      name: "Admin 1",
      position: "Admin",
    },
    {
      id: "id-2",
      username: "admin2",
      name: "Admin 2",
      position: "Admin",
    },
    {
      id: "id-3",
      username: "admin3",
      name: "Admin 3",
      position: "Admin",
    },
  ];

  return {
    roomStats,
    recentRooms,
    reservationStats,
    recentReservations,
    recentStaff,
    recentAdmins
  };
};