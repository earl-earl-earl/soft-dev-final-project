// app/api/admin/[adminId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);

interface RouteContext {
  params: {
    adminId: string; // This comes from the [adminId] folder name
  }
}

// Helper function to get the role and ID of the user making the request
// In a real app, this would come from verifying a session token (JWT) or Supabase session cookie.
async function getRequestingUserInfo(request: NextRequest): Promise<{ id: string; role: string } | null> {
  // Placeholder: Replace with your actual session/token verification logic
  // For example, if using Supabase Auth on the client and it sets cookies that this API can read:
  // const tempSupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  //   global: { headers: { Authorization: request.headers.get('Authorization')! } }
  // });
  // const { data: { user } } = await tempSupabaseClient.auth.getUser();
  // if (user) {
  //   const { data: userProfile } = await supabaseAdminClient.from('users').select('role').eq('id', user.id).single();
  //   if (userProfile) return { id: user.id, role: userProfile.role };
  // }

  // For demonstration, assuming a header or a fixed role for testing:
  const mockRole = request.headers.get('X-User-Role') || 'super_admin'; // Default to super_admin for testing
  const mockId = request.headers.get('X-User-Id') || 'mock-super-admin-id';
  console.warn(`API Authorization: Using mock user role '${mockRole}' and ID '${mockId}'. IMPLEMENT REAL AUTH!`);
  return { id: mockId, role: mockRole };
  // return null; // If no user is authenticated
}


export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { adminId } = params; // The ID of the admin whose status is to be changed
  
  if (!adminId) {
    return NextResponse.json({ error: 'Admin User ID is required.' }, { status: 400 });
  }
  console.log(`API PATCH /api/admin/${adminId}/status: Received request.`);

  try {
    const { isActive } = (await request.json()) as { isActive: boolean }; 

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: "'isActive' (boolean) field is required in the request body." }, { status: 400 });
    }

    // --- AUTHORIZATION CHECK ---
    const requestingUser = await getRequestingUserInfo(request);
    if (!requestingUser) {
      return NextResponse.json({ error: 'Unauthorized: No authenticated user found.' }, { status: 401 });
    }

    const { data: targetUser, error: targetUserFetchError } = await supabaseAdminClient
      .from('users')
      .select('role, is_active') // Also fetch current is_active to avoid unnecessary updates
      .eq('id', adminId)
      .single();

    if (targetUserFetchError || !targetUser) {
      return NextResponse.json({ error: 'Target admin user not found.' }, { status: 404 });
    }

    // REQ-ADMINUSR-14: Prevent deactivation of 'super_admin' via UI.
    if (targetUser.role === 'super_admin' && isActive === false) {
      console.warn(`API PATCH: Attempt to deactivate super_admin ${adminId} by ${requestingUser.id} (${requestingUser.role}) denied.`);
      return NextResponse.json({ error: 'Super admin accounts cannot be deactivated.' }, { status: 403 });
    }

    // REQ-ADMINUSR-13 & REQ-ADMINUSR-07:
    // Only 'super_admin' can deactivate/reactivate an 'admin'.
    // An 'admin' cannot deactivate another 'admin' (unless it's themselves, which is usually not a UI flow).
    if (targetUser.role === 'admin') {
      if (requestingUser.role !== 'super_admin') {
        // If the requesting user is an 'admin', they cannot change another 'admin's status.
        // Exception: an admin *could* potentially deactivate themselves if that's a desired feature,
        // but this endpoint is typically for an admin managing other users.
        if (requestingUser.id !== adminId || requestingUser.role !== 'super_admin') { // Super admin can always proceed
             console.warn(`API PATCH: User ${requestingUser.id} (${requestingUser.role}) attempt to change status of admin ${adminId} denied.`);
            return NextResponse.json({ error: 'Permission denied: Only Super Admins can change the status of admin accounts.' }, { status: 403 });
        }
      }
    }
    // --- END AUTHORIZATION CHECK ---

    // Check if an update is even needed
    if (targetUser.is_active === isActive) {
        console.log(`API PATCH /api/admin/${adminId}/status: No change needed. User is already ${isActive ? 'active' : 'inactive'}.`);
        return NextResponse.json({ message: `Admin user status is already ${isActive ? 'Active' : 'Inactive'}.` }, { status: 200 });
    }


    console.log(`API PATCH /api/admin/${adminId}/status: Updating users.is_active to:`, isActive);
    const { error: updateError } = await supabaseAdminClient
      .from('users')
      .update({ 
        is_active: isActive,
        last_updated: new Date().toISOString() 
      })
      .eq('id', adminId);

    if (updateError) {
      console.error(`API PATCH /api/admin/${adminId}/status: Error updating status:`, updateError);
      return NextResponse.json({ error: `Failed to update admin status: ${updateError.message}` }, { status: 500 });
    }

    // If deactivating a Supabase Auth user, sign them out from all sessions
    if (isActive === false) {
      // All users created via your forms are Supabase Auth users in this model
      console.log(`API PATCH: User ${adminId} (role: ${targetUser.role}) deactivated. Attempting to sign out from Supabase Auth sessions.`);
      const { error: signOutError } = await supabaseAdminClient.auth.admin.signOut(adminId); 
      if (signOutError) {
          console.error(`API PATCH: Error signing out deactivated user ${adminId} from Supabase Auth:`, signOutError);
          // This is a non-critical error for the deactivation process itself, but should be logged.
      } else {
          console.log(`API PATCH: Successfully signed out user ${adminId} from all Supabase Auth sessions.`);
      }
    }

    console.log(`API PATCH /api/admin/${adminId}/status: Status updated successfully to ${isActive}.`);
    return NextResponse.json({ message: `Admin user status successfully updated to ${isActive ? 'Active' : 'Inactive'}.` }, { status: 200 });

  } catch (error: any) {
    console.error(`API PATCH /api/admin/${adminId}/status - Unhandled error:`, error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) { // Check for JSON parse error from request.json()
        return NextResponse.json({ error: 'Invalid request body: Expected JSON with an "isActive" boolean field.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process status toggle: ' + (error.message || "Unknown server error") }, { status: 500 });
  }
}