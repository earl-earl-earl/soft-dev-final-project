// src/hooks/useRooms.ts
import { useState, useCallback, useEffect } from 'react';
import { Room, RoomFormData } from '../types/room';
import { fetchRooms, FetchRoomsResult, ReservationLookup } from '../utils/fetchRooms';
import { supabase } from '@/lib/supabaseClient'; // Import supabase client

export interface UseRoomsReturn {
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
  formErrors: Record<string, string>;
  addRoom: (roomData: RoomFormData) => Promise<boolean>; 
  updateRoom: (roomId: string, roomData: RoomFormData, initialRoomData: Room) => Promise<boolean>;
  toggleRoomStatus: (roomId: string) => Promise<void>;
  clearError: () => void;
  refreshRooms: () => Promise<void>;
  reservationLookup: ReservationLookup;
  deleteRoom: (roomId: string) => Promise<boolean>; // Add deleteRoom to the return type
}

export const useRooms = (): UseRoomsReturn => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservationLookup, setReservationLookup] = useState<ReservationLookup>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearError = useCallback(() => {
    setError(null);
    setFormErrors({});
  }, []);

  const refreshRooms = useCallback(async () => {
    // console.log("useRooms: refreshRooms called, setting isLoading to true.");
    setIsLoading(true);
    setFormErrors({}); 
    setError(null);
    try {
      const result: FetchRoomsResult = await fetchRooms(); 
      // console.log("useRooms: fetchRooms returned:", result); 

      if (result.rooms) {
        // console.log("useRooms.ts - refreshRooms - Data received from fetchRooms (first room):", result.rooms[0]); 
        setRooms(result.rooms); 
      } else if (result.error) { 
        setError(result.error);
        setRooms([]); 
      } else {
        setError("Failed to load rooms: Unexpected response structure from fetchRooms.");
        setRooms([]); 
      }

      if (result.reservationLookup) {
        setReservationLookup(result.reservationLookup);
      } else {
        setReservationLookup({});
      }
    } catch (err: any) { 
      console.error("useRooms: Error in refreshRooms catch block:", err);
      setError(err.message || "Failed to load rooms: An unknown error occurred.");
      setRooms([]); 
      setReservationLookup({}); 
    } finally {
      // console.log("useRooms: refreshRooms finally block, setting isLoading to false.");
      setIsLoading(false); // <<< THIS IS THE FIX FOR "STUCK ON LOADING"
    }
  }, []); 

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  const addRoom = useCallback(async (roomData: RoomFormData): Promise<boolean> => {
    setIsLoading(true); // <<<< CORRECTED: Should be true when operation starts
    setFormErrors({});
    setError(null);

    const apiFormData = new FormData();
    apiFormData.append('name', roomData.name);
    apiFormData.append('capacity', String(roomData.capacity));
    apiFormData.append('price', String(roomData.price)); 
    apiFormData.append('is_active', String(roomData.isActive)); 
    roomData.amenities.forEach(amenity => apiFormData.append('amenities[]', amenity));
    
    (roomData.images as File[]).forEach(file => { 
      apiFormData.append('images', file);
    });
    if (roomData.panoramicImage instanceof File) {
      apiFormData.append('panoramicImage', roomData.panoramicImage);
    }

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        body: apiFormData, 
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details) setFormErrors(data.details);
        setError(data.error || 'Failed to create room');
        setIsLoading(false);
        return false;
      }
      
      await refreshRooms();
      return true;
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during addRoom');
      console.error("addRoom catch block:", err);
      setIsLoading(false); // Set isLoading false on catch
      return false;
    }
  }, [refreshRooms]);

  const updateRoom = useCallback(async (
    roomId: string, 
    updatedFormData: RoomFormData,
    initialRoomData: Room 
  ): Promise<boolean> => {
    setIsLoading(true); // Set true when operation starts
    setFormErrors({});
    setError(null);

    const apiFormData = new FormData();
    apiFormData.append('id', roomId);
    apiFormData.append('name', updatedFormData.name);
    apiFormData.append('capacity', String(updatedFormData.capacity));
    apiFormData.append('price', String(updatedFormData.price)); 
    apiFormData.append('is_active', String(updatedFormData.isActive));
    updatedFormData.amenities.forEach(amenity => apiFormData.append('amenities[]', amenity));

    updatedFormData.images.forEach(imgOrUrl => {
      if (typeof imgOrUrl === 'string') {
        apiFormData.append('image_urls_to_keep', imgOrUrl);
      } else if (imgOrUrl instanceof File) { 
        apiFormData.append('images', imgOrUrl); 
      }
    });

    if (updatedFormData.panoramicImage instanceof File) {
      apiFormData.append('panoramicImage', updatedFormData.panoramicImage);
    } else if (typeof updatedFormData.panoramicImage === 'string') {
      apiFormData.append('panoramic_image_url_to_keep', updatedFormData.panoramicImage);
    } else if (updatedFormData.panoramicImage === null) {
      apiFormData.append('remove_panoramic_image', 'true');
    }

    try {
      const response = await fetch(`/api/rooms`, {
        method: 'PUT',
        body: apiFormData, 
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details) setFormErrors(data.details);
        setError(data.error || 'Failed to update room');
        setIsLoading(false); // Set isLoading false on specific error
        return false;
      }
      
      await refreshRooms(); // refreshRooms will handle setting isLoading to false
      return true;
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during updateRoom');
      console.error("updateRoom catch block:", err);
      setIsLoading(false); // Set isLoading false on catch
      return false;
    }
  }, [refreshRooms]);

  const toggleRoomStatus = useCallback(async (roomId: string) => {
    setError(null);
    setFormErrors({});

    const roomToToggle = rooms.find(r => String(r.id) === roomId);
    if (!roomToToggle) {
      setError('Room not found for toggling status.');
      return; // No explicit setIsLoading(false) here, as refreshRooms will handle it or an error will be set.
    }

    const apiFormData = new FormData();
    apiFormData.append('id', roomId);
    apiFormData.append('is_active', String(!roomToToggle.isActive));

    try {
      const response = await fetch(`/api/rooms`, {
        method: 'PUT',
        body: apiFormData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle room status');
      }
      
      await refreshRooms(); // refreshRooms will handle setting isLoading to false
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during toggle');
      console.error("toggleRoomStatus catch block:", err);
    }
  }, [rooms, refreshRooms]);

  const deleteRoom = useCallback(async (roomId: string): Promise<boolean> => {
    setIsLoading(true);
    setFormErrors({});
    setError(null);

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session. Please log in again.');
        setIsLoading(false);
        return false;
      }
      const accessToken = session.access_token;

      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete room');
        setIsLoading(false);
        return false;
      }
      
      await refreshRooms();
      return true;
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while deleting the room');
      console.error("deleteRoom catch block:", err);
      setIsLoading(false);
      return false;
    }
  }, [refreshRooms]);

  const returnValue = {
    rooms,
    isLoading,
    error,
    formErrors,
    addRoom,
    updateRoom,
    toggleRoomStatus,
    deleteRoom, // Add this
    clearError,
    refreshRooms,
    reservationLookup,
  };
  
  // console.log("useRooms.ts - FINAL RETURN VALUE - reservationLookup:", returnValue.reservationLookup, "isLoading:", returnValue.isLoading);
  return returnValue;
};