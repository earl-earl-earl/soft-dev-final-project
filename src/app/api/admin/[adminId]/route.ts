import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr'; // For user session
import { createClient } from '@supabase/supabase-js'; // For admin operations
import { cookies } from 'next/headers'; // For App Router cookie access
import { AdminFormData, AdminMember } from '../../../../../src/types/admin'; // Adjust path if using aliases

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Needed for createServerClient

// This admin client is for operations requiring service_role (like modifying other users' auth details or bypassing RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Password policy validation helper
const validatePasswordPolicyOnServer = (password: string): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  if (password.length < 8) messages.push("be at least 8 characters");
  if (!/[A-Z]/.test(password)) messages.push("contain an uppercase letter");
  if (!/[a-z]/.test(password)) messages.push("contain a lowercase letter");
  if (!/[0-9]/.test(password)) messages.push("contain a number");
  if (!/[^A-Za-z0-9]/.test(password)) messages.push("contain a special character");
  return { isValid: messages.length === 0, messages };
};

// --- Function to get the currently authenticated user making the request ---
async function getRequestingUserInfo(request: NextRequest): Promise<{ id: string; role: string; email: string; } | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("getRequestingUserInfo: Supabase URL or Anon Key is not defined.");
    return null;
  }
  
  const cookieStore = await cookies();
  const supabase = createServerClient( // Create a client scoped to this request to read its cookies
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Set and remove are not strictly needed if this function only GETS the user,
        // but good to have if any auth state might be modified by this client instance.
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }); } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.delete({ name, ...options }); } catch (error) {}
        },
      },
    }
  );

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    console.warn("getRequestingUserInfo: No Supabase Auth user found from session.", authError?.message);
    return null;
  }

  // Now get their role from your public.users table
  const { data: userProfile, error: profileError } = await supabaseAdmin // Use admin client to bypass RLS for this internal lookup
    .from('users')
    .select('id, role, email')
    .eq('id', authUser.id)
    .single();

  if (profileError || !userProfile) {
    console.error(`getRequestingUserInfo: User profile not found in 'users' table for auth ID ${authUser.id}. Inconsistency.`, profileError?.message);
    return null; // Or handle as a more critical error (e.g., sign out user from auth)
  }
  
  console.log(`getRequestingUserInfo: Authenticated user making request: ID=${userProfile.id}, Role=${userProfile.role}`);
  return { id: userProfile.id, role: userProfile.role, email: userProfile.email };
}


interface RouteContext {
  params: {
    adminId: string; // The ID of the admin being edited
  }
}

// --- PUT Handler (Update Admin User Details) ---
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { adminId } = params;
  const operationId = Date.now();

  console.log(`[${operationId}] API PUT /api/admin/${adminId}: Received update request.`);

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }
  if (!adminId) {
    return NextResponse.json({ error: 'Admin User ID is required in the path.' }, { status: 400 });
  }

  try {
    const adminData = (await request.json()) as Partial<AdminFormData>;
    console.log(`[${operationId}] API PUT /api/admin/${adminId}: Received data:`, JSON.stringify(adminData, null, 2));

    // --- AUTHORIZATION ---
    const requestingUser = await getRequestingUserInfo(request);
    if (!requestingUser) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { data: targetUser, error: targetUserFetchError } = await supabaseAdmin
      .from('users')
      .select('role, id') // Select role and id of the user being targeted
      .eq('id', adminId)
      .single();

    if (targetUserFetchError || !targetUser) {
      return NextResponse.json({ error: 'Target admin user not found.' }, { status: 404 });
    }

    // REQ-ADMINUSR-14: Super admin role cannot be changed by others, and certain fields are restricted.
    // Note: This PUT endpoint doesn't change is_active, that's for the /status PATCH endpoint.
    if (targetUser.role === 'super_admin' && requestingUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permission Denied: Only Super Admins can modify Super Admin accounts.' }, { status: 403 });
    }
    // REQ-ADMINUSR-07: 'admin' cannot modify other 'admin' or 'super_admin' accounts.
    if (requestingUser.role === 'admin' && 
        (targetUser.role === 'admin' || targetUser.role === 'super_admin') && 
        requestingUser.id !== adminId) { // An admin can edit their own profile (except role, unless SA)
      return NextResponse.json({ error: 'Permission Denied: Admins cannot modify other admin or super admin accounts.' }, { status: 403 });
    }
    // --- END AUTHORIZATION ---


    // 1. Update Supabase Auth User (Password if provided)
    if (adminData.password && adminData.password.length > 0) {
      // Authorization for password change: Only super_admin or self can change password
      if (requestingUser.role !== 'super_admin' && requestingUser.id !== adminId) {
        return NextResponse.json({ error: 'Permission denied to change this user\'s password.' }, { status: 403 });
      }
      const passwordPolicyCheck = validatePasswordPolicyOnServer(adminData.password);
      if (!passwordPolicyCheck.isValid) {
          return NextResponse.json({ error: `New password does not meet policy: ${passwordPolicyCheck.messages.join(', ')}`, formErrors: { password: `Must: ${passwordPolicyCheck.messages.join(', ')}`}}, { status: 400 });
      }
      const { error: authPasswordError } = await supabaseAdmin.auth.admin.updateUserById(adminId, { password: adminData.password });
      if (authPasswordError) {
        return NextResponse.json({ error: `Failed to update auth password: ${authPasswordError.message}` }, { status: 500 });
      }
    }

    // 2. Update public.users table
    const userUpdatePayload: Partial<{ role: string; email: string; last_updated: string; }> = {
      last_updated: new Date().toISOString()
    };
    let userTableNeedsUpdate = false;

    if (adminData.role !== undefined) {
      const newDbRole = adminData.role.toLowerCase();
      if (requestingUser.role !== 'super_admin' && newDbRole !== targetUser.role) { // Only SA can change roles
        return NextResponse.json({ error: "Permission Denied: Only Super Admins can change user roles." }, { status: 403 });
      }
      if (targetUser.role === 'super_admin' && newDbRole !== 'super_admin') { // SA cannot be demoted by this general update
        return NextResponse.json({ error: "Super Admin role cannot be changed to a lower privilege via this action." }, { status: 403 });
      }
      // if (newDbRole !== 'admin' && newDbRole !== 'super_admin') { // Ensure target is still admin type
      //   return NextResponse.json({ error: `Invalid target role '${adminData.role}'. Admins must have 'admin' or 'super_admin' role.` }, { status: 400 });
      // }
      if (newDbRole !== targetUser.role) { // Only update if role actually changes
        userUpdatePayload.role = newDbRole;
        userTableNeedsUpdate = true;
      }
    }
    // Email is tied to Supabase Auth and usually not changed directly here.
    // If adminData.email is for users.email (and it's allowed to be different from auth.email):
    // if (adminData.email !== undefined) { userUpdatePayload.email = adminData.email; userTableNeedsUpdate = true; }

    if (Object.keys(userUpdatePayload).length > 1 || userTableNeedsUpdate) { // If there's more than just last_updated or role changed
      const { error: publicUserUpdateError } = await supabaseAdmin.from('users').update(userUpdatePayload).eq('id', adminId);
      if (publicUserUpdateError) {
        return NextResponse.json({ error: `Failed to update user core info: ${publicUserUpdateError.message}` }, { status: 500 });
      }
    }

    // 3. Update public.staff table
    const staffProfileUpdatePayload: Partial<{ name: string; username: string | null; phone_number: string | null; is_admin: boolean }> = {};
    let staffProfileNeedsUpdate = false;

    if (adminData.name !== undefined) { staffProfileUpdatePayload.name = adminData.name; staffProfileNeedsUpdate = true; }
    if (adminData.username !== undefined) { staffProfileUpdatePayload.username = adminData.username || null; staffProfileNeedsUpdate = true; }
    if (adminData.phoneNumber !== undefined) { staffProfileUpdatePayload.phone_number = adminData.phoneNumber || null; staffProfileNeedsUpdate = true; }
    
    // Ensure staff.is_admin is true for 'admin' or 'super_admin' roles
    const finalUserRoleForStaffTable = userUpdatePayload.role || targetUser.role;
    const expectedIsAdminFlag = (finalUserRoleForStaffTable === 'admin' || finalUserRoleForStaffTable === 'super_admin');
    staffProfileUpdatePayload.is_admin = expectedIsAdminFlag; // Always ensure this is consistent
    staffProfileNeedsUpdate = true; // Mark for update if is_admin might change or other fields changed

    if (staffProfileNeedsUpdate) {
      const { error: staffError } = await supabaseAdmin.from('staff').update(staffProfileUpdatePayload).eq('user_id', adminId);
      if (staffError) {
        if (staffError.code === '23505' && (staffError.message.includes('staff_username_key') || staffError.message.includes('staff_username_idx'))) {
           return NextResponse.json({ error: "Username already taken in staff profile.", formErrors: { username: "Username already taken."}}, { status: 409 });
        }
        return NextResponse.json({ error: `Failed to update admin's staff profile: ${staffError.message}` }, { status: 500 });
      }
    }

    // Fetch and return the updated AdminMember
    const { data: finalUserDataGet, error: finalUserFetchErrorGet } = await supabaseAdmin.from("users").select('id, email, role, is_active, created_at, last_updated').eq('id', adminId).single();
    const { data: finalStaffDataGet, error: finalStaffFetchErrorGet } = await supabaseAdmin.from("staff").select('user_id, name, username, phone_number, position, is_admin').eq('user_id', adminId).single();

    if (finalUserFetchErrorGet || !finalUserDataGet) {
        return NextResponse.json({ error: "Failed to retrieve updated admin user details after update." }, { status: 500 });
    }
    
    const responseMember: AdminMember = {
        id: finalUserDataGet.id,
        email: finalUserDataGet.email,
        name: finalStaffDataGet?.name || finalUserDataGet.email?.split('@')[0] || "Admin",
        username: finalStaffDataGet?.username || undefined,
        phoneNumber: finalStaffDataGet?.phone_number || undefined,
        role: finalUserDataGet.role as AdminMember['role'],
        isAdmin: finalStaffDataGet?.is_admin !== undefined ? finalStaffDataGet.is_admin : true,
        isActive: finalUserDataGet.is_active,
        created_at: finalUserDataGet.created_at,
        last_updated: finalUserDataGet.last_updated,
    };
    return NextResponse.json(responseMember, { status: 200 });

  } catch (error: any) {
    console.error(`[${operationId}] API PUT /api/admin/${adminId} - Unhandled error:`, error);
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
        return NextResponse.json({ error: 'Invalid request body: Expected JSON.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process admin update: ' + (error.message || "Unknown server error") }, { status: 500 });
  }
}