import { useState, useCallback, useEffect } from 'react';
import { Room, RoomFormData } from '../types/room';
import { fetchRooms } from '../utils/fetchRooms';

export interface UseRoomsReturn {
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
  formErrors: Record<string, string>;
  addRoom: (roomData: RoomFormData) => Promise<void>;
  updateRoom: (roomId: string, roomData: RoomFormData) => Promise<void>;
  toggleRoomStatus: (roomId: string) => Promise<void>;
  clearError: () => void;
  refreshRooms: () => Promise<void>;
}

export const useRooms = (): UseRoomsReturn => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearError = useCallback(() => setError(null), []);

  const refreshRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchRooms();
      if (result.rooms) {
        setRooms(result.rooms);
      }
      setError(null);
    } catch (err) {
      console.error("Error loading rooms:", err);
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load rooms when the component mounts
  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  const addRoom = useCallback(async (roomData: RoomFormData) => {
    try {
      // Make a real API call to create a room
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details) {
          setFormErrors(data.details);
        } else {
          throw new Error(data.error || 'Failed to create room');
        }
        return;
      }
      
      // Refresh rooms to get the latest data
      await refreshRooms();
      setFormErrors({});
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error(err);
    }
  }, [refreshRooms]);

  const updateRoom = useCallback(async (roomId: string, roomData: RoomFormData) => {
    try {
      // Make a real API call to update a room
      const response = await fetch(`/api/rooms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: roomId,
          ...roomData
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details) {
          setFormErrors(data.details);
        } else {
          throw new Error(data.error || 'Failed to update room');
        }
        return;
      }
      
      // Refresh rooms to get the latest data
      await refreshRooms();
      setFormErrors({});
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error(err);
    }
  }, [refreshRooms]);

  const toggleRoomStatus = useCallback(async (roomId: string) => {
    try {
      // Find the room to get its current status
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      
      // Update the room with the opposite isActive status
      const response = await fetch(`/api/rooms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: roomId,
          name: room.name,
          roomNumber: room.roomNumber,
          capacity: room.capacity,
          price: room.price,
          amenities: room.amenities,
          isActive: !room.isActive
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle room status');
      }
      
      // Refresh rooms to get the latest data
      await refreshRooms();
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error(err);
    }
  }, [rooms, refreshRooms]);

  return {
    rooms,
    isLoading,
    error,
    formErrors,
    addRoom,
    updateRoom,
    toggleRoomStatus,
    clearError,
    refreshRooms
  };
};