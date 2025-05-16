import { useState, useCallback } from 'react';
import { Room, RoomFormData } from '../types/room';

// Mock data for development
const initialRoomsData: Room[] = [
  {
    id: "001",
    name: "Emil",
    roomNumber: "#001",
    capacity: 4,
    lastUpdated: "May 07, 2024",
    amenities: ["Free Entrance", "Breakfast for 4"],
    price: 3500.0,
    status: "Occupied",
    reservation: { 
      guestName: "Lozada, Daven J.",
      checkIn: new Date(2025, 4, 10),
      checkOut: new Date(2025, 4, 15)
    },
    isActive: true,
  },
  {
    id: "002",
    name: "Ohana",
    roomNumber: "#002",
    capacity: 2,
    lastUpdated: "May 07, 2024",
    amenities: ["Free Entrance", "Breakfast for 2"],
    price: 2000.0,
    status: "Occupied",
    reservation: { 
      guestName: "Segura, Paul J.",
      checkIn: new Date(2025, 4, 10),
      checkOut: new Date(2025, 4, 15)
    },
    isActive: true,
  },
  {
    id: "003",
    name: "Kyle",
    roomNumber: "#003",
    capacity: 6,
    lastUpdated: "May 07, 2024",
    amenities: ["Free Entrance", "Breakfast for 6"],
    price: 5000.0,
    status: "Vacant",
    isActive: true,
  }
];

export interface UseRoomsReturn {
  rooms: Room[];
  error: string | null;
  formErrors: Record<string, string>;
  addRoom: (roomData: RoomFormData) => Promise<void>;
  updateRoom: (roomId: string, roomData: RoomFormData) => Promise<void>;
  toggleRoomStatus: (roomId: string) => Promise<void>;
  clearError: () => void;
}

export const useRooms = (): UseRoomsReturn => {
  const [rooms, setRooms] = useState<Room[]>(initialRoomsData);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearError = useCallback(() => setError(null), []);

  const addRoom = useCallback(async (roomData: RoomFormData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/rooms', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(roomData),
      // });
      // const data = await response.json();
      
      // Simulate successful response for now
      const newRoom: Room = {
        id: `00${rooms.length + 1}`,
        ...roomData,
        status: "Vacant",
        lastUpdated: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: '2-digit',
          year: 'numeric'
        })
      };
      
      setRooms([...rooms, newRoom]);
      setFormErrors({});
      setError(null);
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  }, [rooms]);

  const updateRoom = useCallback(async (roomId: string, roomData: RoomFormData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/rooms/${roomId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(roomData),
      // });
      // const data = await response.json();
      
      // Simulate successful response
      const updatedRooms = rooms.map(room => 
        room.id === roomId ? {
          ...room,
          ...roomData,
          lastUpdated: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric'
          })
        } : room
      );
      
      setRooms(updatedRooms);
      setFormErrors({});
      setError(null);
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  }, [rooms]);

  const toggleRoomStatus = useCallback(async (roomId: string) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/rooms/${roomId}/toggle-status`, {
      //   method: 'PUT'
      // });
      // const data = await response.json();
      
      // Simulate successful response
      const updatedRooms = rooms.map(room => 
        room.id === roomId 
          ? { ...room, isActive: !room.isActive } 
          : room
      );
      
      setRooms(updatedRooms);
      setError(null);
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  }, [rooms]);

  return {
    rooms,
    error,
    formErrors,
    addRoom,
    updateRoom,
    toggleRoomStatus,
    clearError
  };
};