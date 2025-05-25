// app/api/admin/[adminId]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr'; // For user session
import { createClient as createAdminSupabaseClient } from '@supabase/supabase-js'; // Renamed for clarity
import { cookies } from 'next/headers'; // For App Router cookie access

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This admin client is for operations requiring service_role
const supabaseAdmin = createAdminSupabaseClient(supabaseUrl, supabaseServiceKey);

interface RouteContext {
  params: {
    adminId: string; 
  }
}

// --- Function to get the currently authenticated user making the request ---
async function getRequestingUserInfo(request: NextRequest): Promise<{ id: string; role: string; email: string; } | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("getRequestingUserInfo: Supabase URL or Anon Key for createServerClient is not defined.");
    return null;
  }
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) { try { cookieStore.set({ name, value, ...options }); } catch (error) {} },
        remove(name: string, options: CookieOptions) { try { cookieStore.delete({ name, ...options }); } catch (error) {} },
      },
    }
  );

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    console.warn("getRequestingUserInfo: No Supabase Auth user found from session.", authError?.message);
    return null;
  }

  // Use supabaseAdmin (service role) to fetch user's role from public.users table
  const { data: userProfile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, role, email')
    .eq('id', authUser.id)
    .single();

  if (profileError || !userProfile) {
    console.error(`getRequestingUserInfo: User profile not found in 'users' table for auth ID ${authUser.id}.`, profileError?.message);
    return null; 
  }
  
  // console.log(`getRequestingUserInfo: Authenticated user: ID=${userProfile.id}, Role=${userProfile.role}`);
  return { id: userProfile.id, role: userProfile.role, email: userProfile.email };
}


export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { adminId } = params;
  const operationId = Date.now();
  
  // console.log(`[${operationId}] API PATCH /api/admin/${adminId}/status: Invoked.`);

  if (!adminId) {
    return NextResponse.json({ error: 'Admin User ID is required.' }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const newIsActiveState = payload.isActive; 

    if (typeof newIsActiveState !== 'boolean') {
      return NextResponse.json({ error: "'isActive' (boolean) field is required in the request body." }, { status: 400 });
    }
    // console.log(`[${operationId}] API PATCH: Requesting to set isActive for ${adminId} to: ${newIsActiveState}`);

    // --- AUTHORIZATION ---
    const requestingUser = await getRequestingUserInfo(request);
    if (!requestingUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }
    // console.log(`[${operationId}] API PATCH: Request by User ID=${requestingUser.id}, Role=${requestingUser.role}`);

    const { data: targetUser, error: targetUserFetchError } = await supabaseAdmin
      .from('users')
      .select('role, is_active') 
      .eq('id', adminId)
      .single();

    if (targetUserFetchError) {
      return NextResponse.json({ error: 'Database error: Could not fetch target user details.' }, { status: 500 });
    }
    if (!targetUser) {
      return NextResponse.json({ error: `Target user with ID ${adminId} not found.` }, { status: 404 });
    }
    // console.log(`[${operationId}] API PATCH: Target user ${adminId} found. Role: ${targetUser.role}, Current isActive: ${targetUser.is_active}`);

    // REQ-ADMINUSR-14: Prevent deactivation of any 'super_admin' account.
    if (targetUser.role === 'super_admin' && newIsActiveState === false) {
      const msg = 'Permission Denied: Super admin accounts cannot be deactivated.';
      console.warn(`[${operationId}] API PATCH: ${msg} (Attempt by ${requestingUser.role} ${requestingUser.id})`);
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    // REQ-ADMINUSR-13 & REQ-ADMINUSR-07:
    if (targetUser.role === 'admin') {
      if (requestingUser.role !== 'super_admin') {
        // An 'admin' cannot change the status of another 'admin' unless it's themselves
        if (requestingUser.id !== adminId) { 
            const msg = 'Permission Denied: Admins cannot change the status of other admin accounts.';
            console.warn(`[${operationId}] API PATCH: ${msg} (Admin ${requestingUser.id} on Admin ${adminId})`);
            return NextResponse.json({ error: msg }, { status: 403 });
        }
        // Policy for admin self-deactivation:
        if (requestingUser.id === adminId && newIsActiveState === false) {
            const msg = 'Permission Denied: Admins cannot deactivate their own account through this interface.';
            // Or, if allowed, just log it: console.log(`[${operationId}] API PATCH: Admin ${requestingUser.id} deactivating self.`);
            console.warn(`[${operationId}] API PATCH: ${msg}`);
            return NextResponse.json({ error: msg }, { status: 403 }); // Example: Disallow self-deactivation by admin
        }
      }
    }
    // (Assuming 'staff' role status changes are handled by /api/staff/[staffId]/status)
    if (targetUser.role !== 'admin' && targetUser.role !== 'super_admin') {
        return NextResponse.json({ error: `Target user ${adminId} is not an admin or super_admin. Use staff endpoint for staff users.` }, { status: 400 });
    }
    // --- END AUTHORIZATION ---

    if (targetUser.is_active === newIsActiveState) {
        return NextResponse.json({ message: `Admin user status is already ${newIsActiveState ? 'Active' : 'Inactive'}. No change made.` }, { status: 200 });
    }

    // console.log(`[${operationId}] API PATCH: Updating users.is_active for ${adminId} to: ${newIsActiveState}`);
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_active: newIsActiveState, last_updated: new Date().toISOString() })
      .eq('id', adminId);

    if (updateError) {
      console.error(`[${operationId}] API PATCH: Error updating status in DB for ${adminId}:`, updateError);
      return NextResponse.json({ error: `Failed to update admin status: ${updateError.message}` }, { status: 500 });
    }

    if (newIsActiveState === false) {
      // console.log(`[${operationId}] API PATCH: User ${adminId} (role: ${targetUser.role}) deactivated. Attempting Supabase Auth signOut.`);
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(adminId); 
      if (signOutError) {
          console.error(`[${operationId}] API PATCH: Error signing out user ${adminId} from Supabase Auth:`, JSON.stringify(signOutError, null, 2));
      } else {
          // console.log(`[${operationId}] API PATCH: Successfully initiated signOut for user ${adminId}.`);
      }
    }

    const successMsg = `Admin user status successfully updated to ${newIsActiveState ? 'Active' : 'Inactive'}.`;
    // console.log(`[${operationId}] API PATCH: ${successMsg}`);
    return NextResponse.json({ message: successMsg }, { status: 200 });

  } catch (error: any) {
    console.error(`[${operationId}] API PATCH /api/admin/${adminId}/status - Unhandled error:`, error.message, error.stack);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Invalid request body: Expected JSON with an "isActive" boolean field.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process status toggle: ' + (error.message || "Unknown server error") }, { status: 500 });
  }
}