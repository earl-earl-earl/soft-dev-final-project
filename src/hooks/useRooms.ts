// src/hooks/useRooms.ts
import { useState, useCallback, useEffect } from 'react';
import { Room, RoomFormData } from '../types/room'; // Ensure these types are the updated ones
import { fetchRooms, FetchRoomsResult } from '../utils/fetchRooms'; // Assuming fetchRooms and its result type

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
}

export const useRooms = (): UseRoomsReturn => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearError = useCallback(() => {
    setError(null);
    setFormErrors({});
  }, []);

  const refreshRooms = useCallback(async () => {
    setIsLoading(true);
    setFormErrors({}); 
    try {
      const result: FetchRoomsResult = await fetchRooms(); // Assuming fetchRooms returns FetchRoomsResult
      if (result.rooms) {
        setRooms(result.rooms); 
        setError(null);
      } else if (result && typeof result === 'object' && 'error' in result) { // Prefer a consistent error property from fetchRooms
        setError((result as { error?: string }).error || "Failed to load rooms: Unknown error.");
      } else {
        // Fallback if result structure is unexpected
        setError("Failed to load rooms: Unexpected response structure.");
      }
    } catch (err) {
      console.error("Error loading rooms:", err);
      setError(err instanceof Error ? err.message : "Failed to load rooms: An unknown error occurred.");
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
    apiFormData.append('price', String(roomData.price)); // API expects 'price' in FormData
    apiFormData.append('is_active', String(roomData.is_active));
    roomData.amenities.forEach(amenity => apiFormData.append('amenities[]', amenity));
    
    (roomData.images as File[]).forEach(file => { // Assuming for ADD, images are always File[]
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
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during addRoom');
      console.error("addRoom catch block:", err);
      setIsLoading(false);
      return false;
    }
  }, [refreshRooms]);

  const updateRoom = useCallback(async (
    roomId: string, 
    updatedFormData: RoomFormData,
    initialRoomData: Room 
  ): Promise<boolean> => {
    setIsLoading(true);
    setFormErrors({});
    setError(null);

    const apiFormData = new FormData();
    apiFormData.append('id', roomId);

    apiFormData.append('name', updatedFormData.name);
    apiFormData.append('capacity', String(updatedFormData.capacity));
    apiFormData.append('price', String(updatedFormData.price)); // API expects 'price' in FormData
    apiFormData.append('is_active', String(updatedFormData.is_active));
    updatedFormData.amenities.forEach(amenity => apiFormData.append('amenities[]', amenity));

    console.log("CLIENT: updateRoom - updatedFormData.images:", updatedFormData.images); 

    updatedFormData.images.forEach(imgOrUrl => {
      if (typeof imgOrUrl === 'string') {
        apiFormData.append('image_urls_to_keep', imgOrUrl);
        console.log("CLIENT: updateRoom - Appending to image_urls_to_keep:", imgOrUrl);
      } else if (imgOrUrl instanceof File) { // Ensure it's a File
        apiFormData.append('images', imgOrUrl); 
        console.log("CLIENT: updateRoom - Appending new File to images:", imgOrUrl.name);
      }
    });

    if (updatedFormData.panoramicImage instanceof File) {
      apiFormData.append('panoramicImage', updatedFormData.panoramicImage);
      console.log("CLIENT: updateRoom - Appending new File to panoramicImage:", updatedFormData.panoramicImage.name);
    } else if (typeof updatedFormData.panoramicImage === 'string') {
      apiFormData.append('panoramic_image_url_to_keep', updatedFormData.panoramicImage);
      console.log("CLIENT: updateRoom - Appending to panoramic_image_url_to_keep:", updatedFormData.panoramicImage);
    } else if (updatedFormData.panoramicImage === null) {
      apiFormData.append('remove_panoramic_image', 'true');
      console.log("CLIENT: updateRoom - Flagging panoramic_image for removal");
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
        setIsLoading(false);
        return false;
      }
      
      await refreshRooms();
      return true;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during updateRoom');
      console.error("updateRoom catch block:", err);
      setIsLoading(false);
      return false;
    }
  }, [refreshRooms]);

  const toggleRoomStatus = useCallback(async (roomId: string) => {
    setIsLoading(true); 
    setError(null);
    setFormErrors({});

    const roomToToggle = rooms.find(r => String(r.id) === roomId); // Ensure ID comparison is safe
    if (!roomToToggle) {
      setError('Room not found for toggling status.');
      setIsLoading(false);
      return;
    }

    const apiFormData = new FormData();
    apiFormData.append('id', roomId);
    apiFormData.append('is_active', String(!roomToToggle.is_active)); 

    try {
      const response = await fetch(`/api/rooms`, {
        method: 'PUT',
        body: apiFormData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle room status');
      }
      
      await refreshRooms();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during toggle');
      console.error("toggleRoomStatus catch block:", err);
      setIsLoading(false); 
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