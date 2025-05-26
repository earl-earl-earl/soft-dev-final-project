import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to get the requesting user's info (id, role)
async function getRequestingUserInfo(request: NextRequest) {
  // 1. Try Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const accessToken = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (user) {
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .single();
      if (userProfile) return { id: userProfile.id, role: userProfile.role };
    }
  }
  // 2. Fallback to cookie-based auth (SSR)
  const cookieStore = cookies();
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) { return cookieStore.get(name)?.value; },
      set() {},
      remove() {},
    },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;
  const { data: userProfile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single();
  if (profileError || !userProfile) return null;
  return { id: userProfile.id, role: userProfile.role };
}

interface RouteContext { params: { reservationId: string } }

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { reservationId } = context.params;

  // 1. Auth & role
  const user = await getRequestingUserInfo(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // 2. Fetch reservation
  const { data: reservation, error: fetchError } = await supabaseAdmin
    .from('reservations')
    .select('id, status, payment_received')
    .eq('id', reservationId)
    .single();
  if (fetchError || !reservation) {
    return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 });
  }

  const status = reservation.status;
  const paymentReceived = reservation.payment_received;

  // 3. Permission logic
  const allowedForStaff = [
    'Pending', 'Rejected', 'Expired', 'Cancelled',
  ];
  if (user.role === 'staff') {
    if (!allowedForStaff.includes(status)) {
      return NextResponse.json({ error: 'Permission denied: Staff can only delete Pending, Rejected, Expired, or Cancelled reservations.' }, { status: 403 });
    }
  } else if (user.role === 'admin') {
    if (
      !allowedForStaff.includes(status) &&
      !(status === 'Confirmed_Pending_Payment' && paymentReceived === false)
    ) {
      return NextResponse.json({ error: 'Permission denied: Admins can only delete Pending, Rejected, Expired, Cancelled, or unpaid Confirmed_Pending_Payment reservations.' }, { status: 403 });
    }
  } else if (user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 });
  }

  // 4. Delete reservation
  const { error: deleteError } = await supabaseAdmin
    .from('reservations')
    .delete()
    .eq('id', reservationId);
  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete reservation: ' + deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Reservation deleted successfully.' });
}
