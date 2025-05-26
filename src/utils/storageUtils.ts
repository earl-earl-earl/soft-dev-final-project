import { supabase } from '@/lib/supabaseClient';
import { SupabaseClient } from '@supabase/supabase-js';

const ROOM_IMAGES_BUCKET = 'room-images';

export async function deleteFilesFromSupabase(
  publicUrls: string[],
  supabaseClient: SupabaseClient = supabase
): Promise<void> {
  if (!publicUrls || publicUrls.length === 0) {
    return;
  }

  const storagePaths = publicUrls.map(fullUrl => {
    try {
      if (!fullUrl || typeof fullUrl !== 'string') {
        return '';
      }
      const url = new URL(fullUrl);
      const bucketPathSegment = `/${ROOM_IMAGES_BUCKET}/`;
      const startIndex = url.pathname.indexOf(bucketPathSegment);
      
      if (startIndex === -1) {
        console.warn(`Could not find bucket segment in URL: ${fullUrl}`);
        return ''; 
      }
      
      return decodeURIComponent(url.pathname.substring(startIndex + bucketPathSegment.length));
    } catch (e) {
      console.warn(`Invalid URL format for deletion: ${fullUrl}`, e);
      return ''; 
    }
  }).filter(path => path);

  if (storagePaths.length === 0) {
    console.log("No valid storage paths derived for deletion");
    return;
  }

  const { data, error } = await supabaseClient.storage 
    .from(ROOM_IMAGES_BUCKET)
    .remove(storagePaths);

  if (error) {
    console.error('Supabase Storage delete error:', error); 
  } else {
    console.log('Supabase Storage delete successful for paths:', storagePaths); 
  }
}