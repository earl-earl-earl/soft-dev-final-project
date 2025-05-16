import { supabase } from '@/lib/supabaseClient';
import { RoomFormData } from '../../components/overlay_components/AddRoomOverlay';

/**
 * Uploads room images to Supabase storage and returns their URLs
 */
export const uploadRoomImages = async (
  images: File[], 
  roomId: string
): Promise<string[]> => {
  const imageUrls: string[] = [];
  
  // Upload each image
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const fileExt = image.name.split('.').pop();
    const fileName = `${roomId}_${i}.${fileExt}`;
    const filePath = `rooms/${roomId}/${fileName}`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('room-images')
      .upload(filePath, image, {
        upsert: true,
        contentType: image.type
      });
    
    if (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    // Get public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('room-images')
      .getPublicUrl(filePath);
      
    imageUrls.push(publicUrl);
  }
  
  return imageUrls;
};

/**
 * Creates a new room with uploaded images
 */
export const createRoomWithImages = async (roomData: RoomFormData): Promise<any> => {
  try {
    // First create the room to get the ID
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: roomData.name,
        roomNumber: roomData.roomNumber,
        capacity: roomData.capacity,
        price: roomData.price,
        amenities: roomData.amenities,
        isActive: roomData.isActive
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create room');
    }
    
    const room = await response.json();
    
    // Now upload the images
    const imageUrls = await uploadRoomImages(roomData.images, room.id);
    
    // Update the room with image URLs
    const updateResponse = await fetch('/api/rooms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: room.id,
        imageUrls
      }),
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.error || 'Failed to update room with images');
    }
    
    return await updateResponse.json();
  } catch (error) {
    console.error('Error creating room with images:', error);
    throw error;
  }
};