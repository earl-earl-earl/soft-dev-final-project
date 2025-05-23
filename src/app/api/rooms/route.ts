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
  pathSuffix: string, // e.g., "roomId/sanitizedName_variant.ext"
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

// Delete files from Supabase Storage based on their public URLs
async function deleteFilesFromSupabase(
  publicUrls: string[],
  supabaseClient: SupabaseClient = supabase
): Promise<void> {
  if (!publicUrls || publicUrls.length === 0) return;

  const storagePaths = publicUrls.map(fullUrl => {
    try {
      const url = new URL(fullUrl);
      // Pathname example: /storage/v1/object/public/room-images/actual/path/in/bucket.jpg
      // We need to extract "actual/path/in/bucket.jpg"
      const bucketPathSegment = `/${ROOM_IMAGES_BUCKET}/`;
      const startIndex = url.pathname.indexOf(bucketPathSegment);
      if (startIndex === -1) {
        console.warn(`Could not find bucket segment in URL: ${fullUrl}`);
        return ''; // Or handle as an error if format is strictly expected
      }
      return url.pathname.substring(startIndex + bucketPathSegment.length);
    } catch (e) {
      console.warn(`Invalid URL format for deletion: ${fullUrl}`, e);
      return ''; // Or handle as an error
    }
  }).filter(path => path); // Filter out any empty strings from parsing errors

  if (storagePaths.length === 0) {
    console.log("No valid storage paths derived for deletion.");
    return;
  }

  const { error } = await supabaseClient.storage
    .from(ROOM_IMAGES_BUCKET)
    .remove(storagePaths);

  if (error) {
    // Log error but don't necessarily throw, as main DB update might still be important
    console.error('Supabase delete error:', error);
  }
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
    roomBaseData.price = parseFloat(formData.get('room_price') as string);
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
        room_price: roomBaseData.price,
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
        const pathSuffix = `${newRoomId}/${sanitizedRoomName}_reg_${index + 1}_${uuidv4().slice(0, 8)}.${fileExtension}`;
        return uploadFileToSupabase(file, pathSuffix);
      });
      uploadedRegularImageUrls = await Promise.all(regularUploadPromises);

      if (panoramicImageFile) {
        const fileExtension = (panoramicImageFile as File).name.split('.').pop() || 'jpg';
        const pathSuffix = `${newRoomId}/${sanitizedRoomName}_pano_${uuidv4().slice(0, 8)}.${fileExtension}`;
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

// PUT handler to update a room
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const roomBaseData: RoomBaseData = {};
    const newRegularImageFiles: File[] = []; // New files for regular images
    let newPanoramicImageFile: File | undefined = undefined; // New file for panoramic

    const roomId = formData.get('id') as string;
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required for update.' }, { status: 400 });
    }
    roomBaseData.id = roomId;

    // Extract non-file fields
    roomBaseData.name = formData.get('name') as string;
    roomBaseData.capacity = parseInt(formData.get('capacity') as string, 10);
    roomBaseData.price = parseFloat(formData.get('room_price') as string);
    roomBaseData.amenities = formData.getAll('amenities[]').map(String) || [];
    const isActiveString = formData.get('isActive') as string;
    if (isActiveString !== null) { // Check if 'isActive' was actually sent
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

    const validation = validateRoomBaseData(roomBaseData, false); // isPost = false
    if (!validation.valid) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }

    // Fetch existing room data
    const { data: existingRoom, error: fetchError } = await supabase
      .from('rooms')
      .select('name, image_paths, panoramic_image_path')
      .eq('id', roomId)
      .single();

    if (fetchError || !existingRoom) {
      return NextResponse.json({ error: 'Room not found or failed to fetch existing data.' }, { status: 404 });
    }

    const currentImagePaths: string[] = existingRoom.image_paths || [];
    const currentPanoramicPath: string | null = existingRoom.panoramic_image_path || null;
    const effectiveRoomName = roomBaseData.name || existingRoom.name; // Use new name if provided, else old
    const sanitizedRoomName = sanitizeForPath(effectiveRoomName || `room_${roomId}`);

    // --- Handle Regular Images ---
    let finalRegularImageUrls: string[] = [...imageUrlsToKeep];
    const regularImagesToDelete = currentImagePaths.filter(path => !imageUrlsToKeep.includes(path));

    try {
      if (newRegularImageFiles.length > 0) {
        const uploadPromises = newRegularImageFiles.map((file, index) => {
          const fileExtension = file.name.split('.').pop() || 'jpg';
          // Path based on how many images are being kept + index of new files
          const pathSuffix = `${roomId}/${sanitizedRoomName}_reg_upd_${finalRegularImageUrls.length + index}_${uuidv4().slice(0,8)}.${fileExtension}`;
          return uploadFileToSupabase(file, pathSuffix);
        });
        const newlyUploadedUrls = await Promise.all(uploadPromises);
        finalRegularImageUrls.push(...newlyUploadedUrls);
      }
      if (regularImagesToDelete.length > 0) {
        await deleteFilesFromSupabase(regularImagesToDelete);
      }
    } catch (uploadError: any) {
      console.error('Regular image update error:', uploadError);
      return NextResponse.json({ error: 'Failed to update regular images.', details: uploadError.message }, { status: 500 });
    }
    
    if (finalRegularImageUrls.length !== 3) {
        return NextResponse.json({ error: 'Room must have exactly 3 regular images after update.' }, { status: 400 });
    }

    // --- Handle Panoramic Image ---
    let finalPanoramicImageUrl: string | null = null;

    try {
      if (newPanoramicImageFile) { // New panoramic uploaded
        if (currentPanoramicPath) await deleteFilesFromSupabase([currentPanoramicPath]); // Delete old
        const fileExtension = (newPanoramicImageFile as File).name.split('.').pop() || 'jpg';
        const pathSuffix = `${roomId}/${sanitizedRoomName}_pano_upd_${uuidv4().slice(0,8)}.${fileExtension}`;
        finalPanoramicImageUrl = await uploadFileToSupabase(newPanoramicImageFile as File, pathSuffix);
      } else if (panoramicImageUrlToKeep) { // Explicitly keep existing
        finalPanoramicImageUrl = panoramicImageUrlToKeep;
      } else if (removePanoramicImageFlag) { // Explicitly remove
        if (currentPanoramicPath) await deleteFilesFromSupabase([currentPanoramicPath]);
        finalPanoramicImageUrl = null; // Set to null in DB
      } else { // No action specified, so retain current path if it exists
        finalPanoramicImageUrl = currentPanoramicPath;
      }
    } catch (uploadError: any) {
      console.error('Panoramic image update error:', uploadError);
      return NextResponse.json({ error: 'Failed to update panoramic image.', details: uploadError.message }, { status: 500 });
    }

    // Server-side validation: if a panoramic image is always required
    if (!finalPanoramicImageUrl) { // Adjust if panoramic can be optional
        // return NextResponse.json({ error: 'A panoramic image is required after update.' }, { status: 400 });
    }

    // Update room in database
    const dbUpdatePayload: any = {
        image_paths: finalRegularImageUrls,
        panoramic_image_path: finalPanoramicImageUrl,
        last_updated: new Date().toISOString(),
    };
    // Conditionally add fields to update only if they were provided in FormData
    if (roomBaseData.name) dbUpdatePayload.name = roomBaseData.name;
    if (roomBaseData.capacity !== undefined) dbUpdatePayload.capacity = roomBaseData.capacity;
    if (roomBaseData.price !== undefined) dbUpdatePayload.price = roomBaseData.price;
    if (roomBaseData.amenities !== undefined) dbUpdatePayload.amenities = roomBaseData.amenities;
    if (roomBaseData.is_active !== undefined) dbUpdatePayload.is_active = roomBaseData.is_active;


    const { data: updatedDbRoomData, error: dbUpdateError } = await supabase
      .from('rooms')
      .update(dbUpdatePayload)
      .eq('id', roomId)
      .select()
      .single();

    if (dbUpdateError) {
      console.error('Room DB update error:', dbUpdateError);
      return NextResponse.json({ error: 'Failed to update room in database.', details: dbUpdateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedDbRoomData);

  } catch (e: any) {
    console.error('PUT request processing error:', e);
    return NextResponse.json({ error: 'Failed to process PUT request.', details: e.message }, { status: 500 });
  }
}