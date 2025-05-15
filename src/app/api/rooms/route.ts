import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define room data interface
interface RoomData {
  id?: string | number;
  name?: string;
  roomNumber?: string;
  capacity?: number;
  price?: number;
  amenities?: string[];
  is_active?: boolean;
}

// Validation function for room data
function validateRoomData(data: RoomData): { valid: boolean; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.name = 'Room name is required';
  }
  
  if (!data.roomNumber || typeof data.roomNumber !== 'string' || !data.roomNumber.trim()) {
    errors.roomNumber = 'Room number is required';
  }
  
  if (!data.capacity || typeof data.capacity !== 'number' || data.capacity < 1) {
    errors.capacity = 'Capacity must be at least 1';
  }
  
  if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
    errors.price = 'Price must be greater than 0';
  }
  
  return { 
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  };
}

// GET handler to fetch all rooms
export async function GET() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*');
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

// POST handler to create a new room
export async function POST(request: NextRequest) {
  try {
    const roomData = await request.json();
    
    // Validate the room data
    const validation = validateRoomData(roomData);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors }, 
        { status: 400 }
      );
    }
    
    // Insert data into the database
    const { data, error } = await supabase
      .from('rooms')
      .insert([
        {
          name: roomData.name,
          room_number: roomData.roomNumber,
          capacity: roomData.capacity,
          price: roomData.price,
          amenities: roomData.amenities || [],
          is_active: true
        }
      ])
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
}

// PUT handler to update a room
export async function PUT(request: NextRequest) {
  try {
    const roomData = await request.json();
    
    if (!roomData.id) {
      return NextResponse.json(
        { error: 'Room ID is required' }, 
        { status: 400 }
      );
    }
    
    // Validate the room data
    const validation = validateRoomData(roomData);
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors }, 
        { status: 400 }
      );
    }
    
    // Update data in the database
    const { data, error } = await supabase
      .from('rooms')
      .update({
        name: roomData.name,
        room_number: roomData.roomNumber,
        capacity: roomData.capacity,
        price: roomData.price,
        amenities: roomData.amenities || [],
        is_active: roomData.isActive  // Add this line to update active status
      })
      .eq('id', roomData.id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
}