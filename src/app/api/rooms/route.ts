import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid'; // For unique parts in file names

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ROOM_IMAGES_BUCKET = 'room-images'; // Your Supabase bucket name

// --- HELPER FUNCTIONS ---

// Sanitize room name for use in file paths
function sanitizeForPath(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w.-]/g, ''); // Allow alphanumeric, underscore, dot, hyphen
}

// Upload a file to Supabase Storage and return its public URL
async function uploadFileToSupabase(
  file: File,
  pathSuffix: string, // e.g., "roomId/subfolder/fileName.ext"
  supabaseClient: SupabaseClient = supabase
): Promise<string> {
  const { data, error } = await supabaseClient.storage
    .from(ROOM_IMAGES_BUCKET)
    .upload(pathSuffix, file, {
      cacheControl: '3600', // Cache for 1 hour
      upsert: true,          // Overwrite if file exists (useful for updates)
    });

  if (error) {
    console.error(`Supabase upload error for ${pathSuffix}:`, error);
    throw new Error(`Failed to upload ${file.name}: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseClient.storage
    .from(ROOM_IMAGES_BUCKET)
    .getPublicUrl(pathSuffix);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    console.error(`Failed to get public URL for ${pathSuffix}.`);
    throw new Error(`Failed to get public URL for ${pathSuffix}. Ensure bucket is public or RLS allows access.`);
  }
  return publicUrlData.publicUrl;
}

// --- INTERFACES AND VALIDATION ---

// Interface for non-file room data extracted from FormData
interface RoomBaseData {
  id?: string; // For PUT requests
  name?: string;
  capacity?: number;
  price?: number;
  amenities?: string[];
  is_active?: boolean;
}

// Validation for non-file room data
function validateRoomBaseData(data: RoomBaseData, isPost: boolean): { valid: boolean; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.name = 'Room name is required and must be a non-empty string.';
  }
  // roomNumber is removed

  if (data.capacity === undefined || typeof data.capacity !== 'number' || data.capacity < 1) {
    errors.capacity = 'Capacity is required and must be a number greater than or equal to 1.';
  }

  if (data.price === undefined || typeof data.price !== 'number' || data.price <= 0) {
    errors.price = 'Price is required and must be a number greater than 0.';
  }

  if (data.amenities && !Array.isArray(data.amenities)) {
    errors.amenities = 'Amenities, if provided, must be an array.';
  } else if (data.amenities) {
    if (!data.amenities.every(item => typeof item === 'string')) {
        errors.amenities = 'All amenities must be strings.';
    }
  }
  
  if (isPost && data.is_active === undefined) { // For POST, is_active should be explicitly set or defaulted
      // data.is_active will be defaulted to true later if not provided
  } else if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
      errors.is_active = 'Is Active must be a boolean.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

// --- API HANDLERS ---

// GET handler to fetch all rooms
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('GET rooms error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('GET request processing error:', e);
    return NextResponse.json({ error: 'Failed to process GET request', details: e.message }, { status: 500 });
  }
}

// POST handler to create a new room
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const roomBaseData: RoomBaseData = {};
    const regularImageFiles: File[] = [];
    let panoramicImageFile: File | null = null;

    // Extract non-file fields
    roomBaseData.name = formData.get('name') as string;
    roomBaseData.capacity = parseInt(formData.get('capacity') as string, 10);
    roomBaseData.price = parseFloat(formData.get('price') as string);
    // For amenities array, client should append 'amenities[]'
    roomBaseData.amenities = formData.getAll('amenities[]').map(String) || [];
    const isActiveString = formData.get('isActive') as string;
    roomBaseData.is_active = isActiveString ? isActiveString === 'true' : true; // Default to true if not specified

    // Extract files
    formData.forEach((value, key) => {
      if (key === 'images' && value instanceof File) {
        regularImageFiles.push(value as File);
      } else if (key === 'panoramicImage' && value instanceof File) {
        panoramicImageFile = value as File;
      }
    });

    const validation = validateRoomBaseData(roomBaseData, true);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }

    // Server-side file count validation (client should also validate)
    if (regularImageFiles.length !== 3) {
      return NextResponse.json({ error: 'Exactly 3 regular images are required.' }, { status: 400 });
    }
    if (!panoramicImageFile) {
      return NextResponse.json({ error: 'A panoramic image is required.' }, { status: 400 });
    }

    // 1. Insert base room data to get ID
    const { data: newRoomDbData, error: roomInsertError } = await supabase
      .from('rooms')
      .insert({
        name: roomBaseData.name,
        capacity: roomBaseData.capacity,
        room_price: roomBaseData.price, // <<<< DB uses 'room_price'
        amenities: roomBaseData.amenities,
        is_active: roomBaseData.is_active,
        last_updated: new Date().toISOString(),
        // image_paths and panoramic_image_path are null initially
      })
      .select('id, name') // Need id for paths, name for sanitized name
      .single();

    if (roomInsertError || !newRoomDbData) {
      console.error('Room DB insert error:', roomInsertError);
      return NextResponse.json({ error: 'Failed to create room entry in database.', details: roomInsertError?.message }, { status: 500 });
    }
    const newRoomId = newRoomDbData.id;
    const sanitizedRoomName = sanitizeForPath(newRoomDbData.name || `room_${newRoomId}`);

    // 2. Upload images
    let uploadedRegularImageUrls: string[] = [];
    let uploadedPanoramicImageUrl: string | null = null;

    try {
      const regularUploadPromises = regularImageFiles.map((file, index) => {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const pathSuffix = `${newRoomId}/regular/${sanitizedRoomName}_${index + 1}_${uuidv4().slice(0, 8)}.${fileExtension}`;
        return uploadFileToSupabase(file, pathSuffix);
      });
      uploadedRegularImageUrls = await Promise.all(regularUploadPromises);

      if (panoramicImageFile) {
        const fileExtension = (panoramicImageFile as File).name.split('.').pop() || 'jpg';
        const pathSuffix = `${newRoomId}/panoramic/${sanitizedRoomName}_pano_${uuidv4().slice(0, 8)}.${fileExtension}`;
        uploadedPanoramicImageUrl = await uploadFileToSupabase(panoramicImageFile, pathSuffix);
      }
    } catch (uploadError: any) {
      console.error('File upload error during POST:', uploadError);
      // CRITICAL: Attempt to delete the partially created room entry if uploads fail
      await supabase.from('rooms').delete().eq('id', newRoomId);
      return NextResponse.json({ error: 'Failed to upload images.', details: uploadError.message }, { status: 500 });
    }

    // 3. Update room record with image URLs
    const { data: finalRoomData, error: roomUpdateError } = await supabase
      .from('rooms')
      .update({
        image_paths: uploadedRegularImageUrls,
        panoramic_image_path: uploadedPanoramicImageUrl,
        last_updated: new Date().toISOString(), // Update timestamp again
      })
      .eq('id', newRoomId)
      .select()
      .single();

    if (roomUpdateError) {
      console.error('Room DB update with image paths error:', roomUpdateError);
      // CRITICAL: Attempt to delete uploaded files if DB update fails
      await deleteFilesFromSupabase(uploadedRegularImageUrls);
      if (uploadedPanoramicImageUrl) await deleteFilesFromSupabase([uploadedPanoramicImageUrl]);
      // The room entry itself might remain without image paths, or try deleting it too.
      return NextResponse.json({ error: 'Failed to update room with image paths.', details: roomUpdateError.message }, { status: 500 });
    }

    return NextResponse.json(finalRoomData, { status: 201 });

  } catch (e: any) {
    console.error('POST request processing error:', e);
    return NextResponse.json({ error: 'Failed to process POST request.', details: e.message }, { status: 500 });
  }
}


async function deleteFilesFromSupabase( // Ensure this function has detailed logging too
  publicUrls: string[],
  supabaseClient: SupabaseClient = supabase
): Promise<void> {
  if (!publicUrls || publicUrls.length === 0) {
    // console.log("DELETE_HELPER: No publicUrls provided for deletion."); // Optional log
    return;
  }

  const storagePaths = publicUrls.map(fullUrl => {
    try {
      if (!fullUrl || typeof fullUrl !== 'string') { // Add check for invalid URL
        console.warn(`DELETE_HELPER: Invalid or empty URL provided: ${fullUrl}`);
        return '';
      }
      const url = new URL(fullUrl);
      const bucketPathSegment = `/${ROOM_IMAGES_BUCKET}/`; 
      const startIndex = url.pathname.indexOf(bucketPathSegment);
      
      // console.log(`DELETE_HELPER: Processing URL: ${fullUrl}, BucketPathSegment: ${bucketPathSegment}, StartIndex: ${startIndex}`);

      if (startIndex === -1) {
        console.warn(`DELETE_HELPER: Could not find bucket segment in URL: ${fullUrl}`);
        return ''; 
      }
      const extractedPath = decodeURIComponent(url.pathname.substring(startIndex + bucketPathSegment.length)); // decodeURIComponent added
      // console.log(`DELETE_HELPER: Extracted path for deletion: ${extractedPath}`);
      return extractedPath;
    } catch (e) {
      console.warn(`DELETE_HELPER: Invalid URL format for deletion: ${fullUrl}`, e);
      return ''; 
    }
  }).filter(path => path); 

  if (storagePaths.length === 0) {
    console.log("DELETE_HELPER: No valid storage paths derived for deletion. Original URLs provided:", publicUrls);
    return;
  }

  console.log("DELETE_HELPER: Attempting to remove paths from Supabase Storage:", storagePaths);
  const { data, error } = await supabaseClient.storage 
    .from(ROOM_IMAGES_BUCKET)
    .remove(storagePaths);

  if (error) {
    console.error('DELETE_HELPER: Supabase Storage delete error:', error); 
  } else {
    console.log('DELETE_HELPER: Supabase Storage delete successful for paths:', storagePaths, 'Response data:', data); 
  }
}


// PUT handler to update a room
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const roomBaseData: RoomBaseData = {};
    const newRegularImageFiles: File[] = []; 
    let newPanoramicImageFile: File | null = null; 

    const roomId = formData.get('id') as string;
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required for update.' }, { status: 400 });
    }
    roomBaseData.id = roomId;

    // Extract non-file fields (name, capacity, price, amenities, is_active)
    const nameValue = formData.get('name');
    if (nameValue !== null) roomBaseData.name = nameValue as string;

    const capacityString = formData.get('capacity');
    if (capacityString !== null) roomBaseData.capacity = parseInt(capacityString as string, 10);
    
    const priceString = formData.get('price'); 
    if (priceString !== null) roomBaseData.price = parseFloat(priceString as string);

    roomBaseData.amenities = formData.getAll('amenities[]').map(String); 

    const isActiveString = formData.get('is_active') as string; 
    if (isActiveString !== null) {
        roomBaseData.is_active = isActiveString === 'true';
    }

    // Extract file-related actions and data from FormData
    const imageUrlsToKeep: string[] = formData.getAll('image_urls_to_keep').map(String);
    formData.forEach((value, key) => {
      if (key === 'images' && value instanceof File) {
        newRegularImageFiles.push(value);
      } else if (key === 'panoramicImage' && value instanceof File) {
        newPanoramicImageFile = value;
      }
    });
    const panoramicImageUrlToKeep = formData.get('panoramic_image_url_to_keep') as string | null;
    const removePanoramicImageFlag = formData.get('remove_panoramic_image') === 'true';

    // --- SERVER LOGGING (START) ---
    console.log(`--- API PUT /api/rooms (Room ID: ${roomId}) ---`);
    console.log("SERVER: Received image_urls_to_keep:", imageUrlsToKeep);
    console.log("SERVER: Received newRegularImageFiles count:", newRegularImageFiles.length, newRegularImageFiles.map(f => f.name));
    console.log("SERVER: Received newPanoramicImageFile:", newPanoramicImageFile ? (newPanoramicImageFile as File).name : 'None');
    console.log("SERVER: Received panoramic_image_url_to_keep:", panoramicImageUrlToKeep);
    console.log("SERVER: Received remove_panoramic_image flag:", removePanoramicImageFlag);
    // --- SERVER LOGGING (END) ---

    const validation = validateRoomBaseData(roomBaseData, false);
    if (!validation.valid) {
      console.error("SERVER: Validation failed", validation.errors);
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }

    const { data: existingRoom, error: fetchError } = await supabase
      .from('rooms')
      .select('name, image_paths, panoramic_image_path') // Select fields needed for comparison/deletion
      .eq('id', roomId)
      .single();

    if (fetchError || !existingRoom) {
      console.error("SERVER: Fetch existing room error or room not found", fetchError);
      return NextResponse.json({ error: 'Room not found or failed to fetch existing data.' }, { status: 404 });
    }

    const currentImagePaths: string[] = existingRoom.image_paths || [];
    const currentPanoramicPath: string | null = existingRoom.panoramic_image_path || null;
    
    console.log("SERVER: Current DB image_paths:", currentImagePaths);
    console.log("SERVER: Current DB panoramic_image_path:", currentPanoramicPath);

    const effectiveRoomName = roomBaseData.name || existingRoom.name; 
    const sanitizedRoomName = sanitizeForPath(effectiveRoomName || `room_${roomId}`);

    // --- Handle Regular Images ---
    let finalRegularImageUrls: string[] = [...imageUrlsToKeep]; // Start with images client wants to keep
    // Identify images that were in the DB but client doesn't want to keep them anymore
    const regularImagesToDelete = currentImagePaths.filter(path => !imageUrlsToKeep.includes(path));

    console.log("SERVER: Calculated regularImagesToDelete:", regularImagesToDelete);
    console.log("SERVER: Initial finalRegularImageUrls (from kept URLs):", finalRegularImageUrls);

    try {
      if (newRegularImageFiles.length > 0) {
        const uploadPromises = newRegularImageFiles.map((file, index) => {
          const fileExtension = file.name.split('.').pop() || 'jpg';
          const pathSuffix = `${roomId}/regular/${sanitizedRoomName}_upd_${finalRegularImageUrls.length + index}_${uuidv4().slice(0,8)}.${fileExtension}`;
          console.log("SERVER: Uploading new regular image to path:", pathSuffix);
          return uploadFileToSupabase(file, pathSuffix);
        });
        const newlyUploadedUrls = await Promise.all(uploadPromises);
        finalRegularImageUrls.push(...newlyUploadedUrls);
        console.log("SERVER: After new regular uploads, finalRegularImageUrls:", finalRegularImageUrls);
      }

      if (regularImagesToDelete.length > 0) {
        console.log("SERVER: Attempting to delete regular images from Supabase Storage:", regularImagesToDelete);
        await deleteFilesFromSupabase(regularImagesToDelete);
      }
    } catch (uploadError: any) {
      console.error('SERVER: Regular image update/delete process error:', uploadError);
      return NextResponse.json({ error: 'Failed to update regular images.', details: uploadError.message }, { status: 500 });
    }
    
    if (finalRegularImageUrls.length !== 3) {
        console.warn("SERVER: Room must have exactly 3 regular images after update. Current count:", finalRegularImageUrls.length);
        return NextResponse.json({ error: 'Room must have exactly 3 regular images after update.' }, { status: 400 });
    }

    // --- Handle Panoramic Image ---
    let finalPanoramicImageUrl: string | null = null;

    try {
      if (newPanoramicImageFile) { 
        console.log("SERVER: New panoramic image file provided. Current DB path:", currentPanoramicPath);
        if (currentPanoramicPath) {
            console.log("SERVER: Deleting old panoramic (due to new upload):", [currentPanoramicPath]);
            await deleteFilesFromSupabase([currentPanoramicPath]); 
        }
        const fileExtension = (newPanoramicImageFile as File).name.split('.').pop() || 'jpg';
        const pathSuffix = `${roomId}/panoramic/${sanitizedRoomName}_pano_upd_${uuidv4().slice(0,8)}.${fileExtension}`;
        console.log("SERVER: Uploading new panoramic image to path:", pathSuffix);
        finalPanoramicImageUrl = await uploadFileToSupabase(newPanoramicImageFile, pathSuffix);
      } else if (panoramicImageUrlToKeep) { 
        finalPanoramicImageUrl = panoramicImageUrlToKeep;
        console.log("SERVER: Keeping existing panoramic image URL:", finalPanoramicImageUrl);
      } else if (removePanoramicImageFlag) { 
        console.log("SERVER: Remove panoramic image flag is true. Current DB path:", currentPanoramicPath);
        if (currentPanoramicPath) {
            console.log("SERVER: Deleting panoramic (due to remove flag):", [currentPanoramicPath]);
            await deleteFilesFromSupabase([currentPanoramicPath]);
        }
        finalPanoramicImageUrl = null; 
      } else { 
        finalPanoramicImageUrl = currentPanoramicPath; // No action, retain current
        console.log("SERVER: No action specified for panoramic image, retaining current:", finalPanoramicImageUrl);
      }
    } catch (uploadError: any) {
      console.error('SERVER: Panoramic image update/delete process error:', uploadError);
      return NextResponse.json({ error: 'Failed to update panoramic image.', details: uploadError.message }, { status: 500 });
    }

    // Update room in database
    const dbUpdatePayload: Record<string, any> = { 
        image_paths: finalRegularImageUrls,
        panoramic_image_path: finalPanoramicImageUrl,
        last_updated: new Date().toISOString(),
    };
    if (roomBaseData.name !== undefined) dbUpdatePayload.name = roomBaseData.name;
    if (roomBaseData.capacity !== undefined) dbUpdatePayload.capacity = roomBaseData.capacity;
    if (roomBaseData.price !== undefined) dbUpdatePayload.room_price = roomBaseData.price; 
    if (roomBaseData.amenities !== undefined) dbUpdatePayload.amenities = roomBaseData.amenities;
    if (roomBaseData.is_active !== undefined) dbUpdatePayload.is_active = roomBaseData.is_active;

    console.log("SERVER: Final DB update payload for room:", dbUpdatePayload);

    const { data: updatedDbRoomData, error: dbUpdateError } = await supabase
      .from('rooms')
      .update(dbUpdatePayload)
      .eq('id', roomId)
      .select()
      .single();

    if (dbUpdateError) {
      console.error('SERVER: Room DB update error:', dbUpdateError);
      return NextResponse.json({ error: 'Failed to update room in database.', details: dbUpdateError.message }, { status: 500 });
    }

    console.log("SERVER: Room update successful. Response:", updatedDbRoomData)
    return NextResponse.json(updatedDbRoomData);

  } catch (e: any) {
    console.error('SERVER: Unhandled PUT request processing error:', e);
    return NextResponse.json({ error: 'Failed to process PUT request.', details: e.message }, { status: 500 });
  }
}
