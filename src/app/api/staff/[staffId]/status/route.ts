// app/api/staff/[staffId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);

interface RouteContext {
  params: { staffId: string; }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { staffId } = params;
  if (!staffId) {
    return NextResponse.json({ error: 'Staff User ID is required.' }, { status: 400 });
  }

  try {
    const { isActive } = (await request.json()) as { isActive: boolean };
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: "'isActive' field (boolean) is required in the request body." }, { status: 400 });
    }

    // Authorization checks (REQ-ADMINUSR-07, REQ-ADMINUSR-13)
    // - Get current user's role (from session/token)
    // - Get target user's role (staffId)
    // - If current user is 'admin', they cannot deactivate another 'admin' or 'super_admin'.
    //   (This logic would be more complex: fetch targetUser.role first)

    const { error: updateError } = await supabaseAdminClient
      .from('users') // 'is_active' is in the 'users' table
      .update({ 
        is_active: isActive,
        last_updated: new Date().toISOString() 
      })
      .eq('id', staffId);

    if (updateError) {
      console.error(`API PATCH /api/staff/${staffId}/status - Error updating status:`, updateError);
      return NextResponse.json({ error: `Failed to update staff status: ${updateError.message}` }, { status: 500 });
    }

    // If deactivating, and if you want to force sign-out from Supabase Auth sessions
    if (!isActive) {
      await supabaseAdminClient.auth.admin.signOut(staffId); 
    }

    return NextResponse.json({ message: 'Staff status updated successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error(`API PATCH /api/staff/${staffId}/status - Unhandled error:`, error);
    return NextResponse.json({ error: 'Failed to process status update: ' + (error.message || "Unknown server error") }, { status: 500 });
  }
}