// src/hooks/useRooms.ts
import { useState, useCallback, useEffect } from 'react';
import { Room, RoomFormData } from '../types/room'; // Ensure these types are the updated ones
import { fetchRooms } from '../utils/fetchRooms'; // Assuming this utility exists and works

export interface UseRoomsReturn {
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
  formErrors: Record<string, string>;
  addRoom: (roomData: RoomFormData) => Promise<boolean>; // Return true on success, false on failure
  updateRoom: (roomId: string, roomData: RoomFormData, initialRoomData: Room) => Promise<boolean>; // Add initialRoomData
  toggleRoomStatus: (roomId: string) => Promise<void>;
  clearError: () => void;
  refreshRooms: () => Promise<void>;
}

export const useRooms = (): UseRoomsReturn => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearError = useCallback(() => {
    setError(null);
    setFormErrors({}); // Also clear form errors
  }, []);

  const refreshRooms = useCallback(async () => {
    setIsLoading(true);
    setFormErrors({}); // Clear form errors on refresh attempt
    try {
      const result = await fetchRooms(); // Assuming fetchRooms GETs /api/rooms
      if (result.rooms) {
        setRooms(result.rooms); // Ensure result.rooms matches Room[]
        setError(null);
      } else if (result) {
        setError(typeof result === 'string' ? result : 'Failed to load rooms');
      }
    } catch (err) {
      console.error("Error loading rooms:", err);
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  const addRoom = useCallback(async (roomData: RoomFormData): Promise<boolean> => {
    setIsLoading(true);
    setFormErrors({});
    setError(null);

    const apiFormData = new FormData();
    apiFormData.append('name', roomData.name);
    apiFormData.append('capacity', String(roomData.capacity));
    apiFormData.append('room_price', String(roomData.price));
    apiFormData.append('is_active', String(roomData.is_active));
    roomData.amenities.forEach(amenity => apiFormData.append('amenities[]', amenity));
    
    // roomData.images for ADD will be File[]
    (roomData.images as File[]).forEach(file => {
      apiFormData.append('images', file);
    });
    if (roomData.panoramicImage instanceof File) {
      apiFormData.append('panoramicImage', roomData.panoramicImage);
    }

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        body: apiFormData, // Send FormData, DO NOT set Content-Type header
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details) setFormErrors(data.details);
        setError(data.error || 'Failed to create room');
        setIsLoading(false);
        return false;
      }
      
      await refreshRooms(); // This will set isLoading to true then false
      // setError(null); // refreshRooms handles this
      // setFormErrors({}); // Already done at the start
      return true;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during addRoom');
      console.error(err);
      setIsLoading(false);
      return false;
    }
    // No finally block for setIsLoading(false) here because refreshRooms handles it.
  }, [refreshRooms]);

  const updateRoom = useCallback(async (
    roomId: string, 
    updatedFormData: RoomFormData,
    initialRoomData: Room // Need initial state to compare for sending only changed fields
  ): Promise<boolean> => {
    setIsLoading(true);
    setFormErrors({});
    setError(null);

    const apiFormData = new FormData();
    apiFormData.append('id', roomId);

    // Append base data only if it has changed or always send if API expects all
    // Your API conditionally updates, so sending only changed or all is fine
    apiFormData.append('name', updatedFormData.name);
    apiFormData.append('capacity', String(updatedFormData.capacity));
    apiFormData.append('room_price', String(updatedFormData.price));
    apiFormData.append('is_active', String(updatedFormData.is_active));
    updatedFormData.amenities.forEach(amenity => apiFormData.append('amenities[]', amenity));

    // Handle regular images (updatedFormData.images is (File | string)[])
    updatedFormData.images.forEach(imgOrUrl => {
      if (typeof imgOrUrl === 'string') {
        apiFormData.append('image_urls_to_keep', imgOrUrl);
      } else {
        apiFormData.append('images', imgOrUrl); // New file
      }
    });

    // Handle panoramic image (updatedFormData.panoramicImage is File | string | null)
    if (updatedFormData.panoramicImage instanceof File) {
      apiFormData.append('panoramicImage', updatedFormData.panoramicImage);
    } else if (typeof updatedFormData.panoramicImage === 'string') {
      apiFormData.append('panoramic_image_url_to_keep', updatedFormData.panoramicImage);
    } else if (updatedFormData.panoramicImage === null) {
      apiFormData.append('remove_panoramic_image', 'true');
    }
    // If undefined (not touched), client sends nothing for panoramic, server should keep existing.

    try {
      const response = await fetch(`/api/rooms`, { // Assuming PUT to /api/rooms with ID in body
        method: 'PUT',
        body: apiFormData, // Send FormData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details) setFormErrors(data.details);
        setError(data.error || 'Failed to update room');
        setIsLoading(false);
        return false;
      }
      
      await refreshRooms();
      return true;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during updateRoom');
      console.error(err);
      setIsLoading(false);
      return false;
    }
  }, [refreshRooms]);

  const toggleRoomStatus = useCallback(async (roomId: string) => {
    setIsLoading(true); // Indicate loading
    setError(null);
    setFormErrors({});

    const roomToToggle = rooms.find(r => r.id === roomId);
    if (!roomToToggle) {
      setError('Room not found for toggling status.');
      setIsLoading(false);
      return;
    }

    // For toggle, we only need to send the ID and the new is_active state.
    // The API's PUT handler is designed to update only fields provided (conditionally).
    const apiFormData = new FormData();
    apiFormData.append('id', roomId);
    apiFormData.append('is_active', String(!roomToToggle.is_active)); // Send the new state

    try {
      const response = await fetch(`/api/rooms`, { // PUT to /api/rooms
        method: 'PUT',
        body: apiFormData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle room status');
      }
      
      await refreshRooms(); // This will set error to null on success
      // setIsLoading is handled by refreshRooms
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during toggle');
      console.error(err);
      setIsLoading(false); // Ensure loading is false on error here
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