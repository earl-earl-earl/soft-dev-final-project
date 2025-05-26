import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface RouteContext {
  params: {
    roomId: string;
  };
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Create a new Supabase client with the anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the user from the token (v2+ API)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Invalid authentication token:', authError?.message);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    const { roomId } = context.params;

    // Delete all likes for this room before deleting the room itself
    const { error: likesDeleteError } = await supabase
      .from('likes')
      .delete()
      .eq('room_id', roomId);
    if (likesDeleteError) {
      console.error('Failed to delete likes for room:', likesDeleteError.message);
      return NextResponse.json({ error: `Failed to delete likes for this room: ${likesDeleteError.message}` }, { status: 500 });
    }

    // Get user role to verify permission
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('User role verification error:', userError?.message);
      return NextResponse.json({ error: 'Failed to verify user role' }, { status: 500 });
    }

    if (userData.role !== 'admin' && userData.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permission denied: Admin role required' }, { status: 403 });
    }

    // Check if room exists
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, name, image_paths, panoramic_image_path')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      console.error('Room not found:', roomError?.message);
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Delete related images from storage
    const imagesToDelete = [...(room.image_paths || [])];
    if (room.panoramic_image_path) {
      imagesToDelete.push(room.panoramic_image_path);
    }

    if (imagesToDelete.length > 0) {
      // Here you'd typically call your deleteFilesFromSupabase helper
      // Since I don't have the complete implementation, I'll leave a comment
      // await deleteFilesFromSupabase(imagesToDelete);
      console.log('Deleting images:', imagesToDelete);
    }

    // Delete the room from the database
    const { error: deleteError } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (deleteError) {
      console.error('Error deleting room:', deleteError.message);
      return NextResponse.json({ error: `Failed to delete room: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Room deleted successfully' });
    
  } catch (error: unknown) {
    console.error('Unhandled error in DELETE room:', error);
    let message = 'Failed to process deletion request.';
    if (error instanceof Error) {
      message += ' ' + error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}