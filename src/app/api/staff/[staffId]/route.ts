// app/api/staff/[staffId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { StaffFormData, StaffMember } from '..../../../src/types/staff'; // Adjust path

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);

const validatePasswordPolicyOnServer = (password: string): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  if (password.length < 8) messages.push("be at least 8 characters");
  if (!/[A-Z]/.test(password)) messages.push("contain an uppercase letter");
  if (!/[a-z]/.test(password)) messages.push("contain a lowercase letter");
  if (!/[0-9]/.test(password)) messages.push("contain a number");
  if (!/[^A-Za-z0-9]/.test(password)) messages.push("contain a special character");
  return { isValid: messages.length === 0, messages };
};

interface RouteContext {
  params: { staffId: string; }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { staffId } = params;
  if (!staffId) {
    return NextResponse.json({ error: 'Staff User ID is required.' }, { status: 400 });
  }

  try {
    const staffData = (await request.json()) as Partial<StaffFormData>;
    console.log(`API PUT /api/staff/${staffId} - Received data for update:`, staffData);

    // --- Authorization Check (Placeholder - Implement based on your auth context) ---
    // const { user: requestingUser, error: sessionError } = await getRequestingUser(request); // Implement this
    // if (sessionError || !requestingUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // const { data: targetUser, error: targetUserError } = await supabaseAdminClient.from('users').select('role').eq('id', staffId).single();
    // if (targetUserError || !targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    // if (requestingUser.role === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'super_admin') && requestingUser.id !== staffId) {
    //   return NextResponse.json({ error: 'Admins cannot modify other admins or super_admins.' }, { status: 403 });
    // }
    // --- End Authorization Check Placeholder ---


    // 1. Update Supabase Auth User (Password if provided)
    if (staffData.password && staffData.password.length > 0) {
      const passwordPolicyCheck = validatePasswordPolicyOnServer(staffData.password);
      if (!passwordPolicyCheck.isValid) {
          return NextResponse.json({ 
              error: `New password does not meet policy. Must: ${passwordPolicyCheck.messages.join(', ')}.`, 
              formErrors: { password: `Password must: ${passwordPolicyCheck.messages.join(', ')}.`} 
          }, { status: 400 });
      }
      const { error: authPasswordError } = await supabaseAdminClient.auth.admin.updateUserById(
        staffId, { password: staffData.password }
      );
      if (authPasswordError) {
        console.error(`API PUT /api/staff/${staffId} - Supabase auth password update error:`, authPasswordError);
        return NextResponse.json({ error: `Failed to update password: ${authPasswordError.message}` }, { status: 500 });
      }
    }

    // 2. Update public.users table
    const userUpdatePayload: Partial<{ role: string; email: string; last_updated: string; /* username column removed */ }> = {
      last_updated: new Date().toISOString()
    };
    let userTableNeedsUpdate = false;

    if (staffData.role !== undefined) {
      const dbUserRole = staffData.role.toLowerCase(); 
      if (dbUserRole === 'staff' || dbUserRole === 'admin') {
          userUpdatePayload.role = dbUserRole;
          userTableNeedsUpdate = true;
      } else {
          console.warn(`API PUT /api/staff/${staffId}: Invalid role for update: ${staffData.role}`);
          // Optionally return error for invalid role
      }
    }
    // Email is disabled in form, so not typically updated here for Supabase Auth user.
    // If it were editable for the users.email column (not auth.users.email directly):
    // if (staffData.email !== undefined) { userUpdatePayload.email = staffData.email; userTableNeedsUpdate = true; }
    
    if (userTableNeedsUpdate) { // Only update if role or other user-specific fields changed
      const { error: publicUserUpdateError } = await supabaseAdminClient
        .from('users').update(userUpdatePayload).eq('id', staffId);
      if (publicUserUpdateError) {
        console.error(`API PUT /api/staff/${staffId} - Error updating public.users:`, publicUserUpdateError);
        return NextResponse.json({ error: `Failed to update user info: ${publicUserUpdateError.message}` }, { status: 500 });
      }
    }

    // 3. Update public.staff table
    const staffProfileUpdatePayload: Partial<{ name: string; username: string; phone_number: string | null; position: string; is_admin: boolean }> = {};
    let staffProfileNeedsUpdate = false;
    if (staffData.name !== undefined) { staffProfileUpdatePayload.name = staffData.name; staffProfileNeedsUpdate = true; }
    if (staffData.username !== undefined) { staffProfileUpdatePayload.username = staffData.username || null; staffProfileNeedsUpdate = true; } // username is in staff table
    if (staffData.phoneNumber !== undefined) { staffProfileUpdatePayload.phone_number = staffData.phoneNumber || null; staffProfileNeedsUpdate = true; }
    if (staffData.position !== undefined) { staffProfileUpdatePayload.position = staffData.position; staffProfileNeedsUpdate = true; }
    if (staffData.isAdmin !== undefined) { staffProfileUpdatePayload.is_admin = staffData.isAdmin; staffProfileNeedsUpdate = true; }

    if (staffProfileNeedsUpdate) {
      const { error: staffError } = await supabaseAdminClient
        .from('staff').update(staffProfileUpdatePayload).eq('user_id', staffId);
      if (staffError) {
        console.error(`API PUT /api/staff/${staffId} - Error updating public.staff:`, staffError);
        if (staffError.code === '23505' && (staffError.message.includes('staff_username_key') || staffError.message.includes('staff_username_idx'))) { // Adjust constraint name
           return NextResponse.json({ error: "Username already taken in staff profile.", formErrors: { username: "Username already taken."}}, { status: 409 });
        }
        return NextResponse.json({ error: `Failed to update staff profile details: ${staffError.message}` }, { status: 500 });
      }
    }

    // Fetch the combined, updated data to return for consistent response
    const { data: finalUserData, error: finalUserFetchError } = await supabaseAdminClient
        .from("users")
        .select('id, email, role, is_active, created_at, last_updated') // Removed username
        .eq('id', staffId)
        .single();
    const { data: finalStaffData, error: finalStaffFetchError } = await supabaseAdminClient
        .from("staff")
        .select('user_id, name, username, phone_number, position, is_admin')
        .eq('user_id', staffId)
        .single();

    if (finalUserFetchError || !finalUserData) { // finalStaffData can be null if staff profile doesn't exist, but users must.
        console.error("API PUT /api/staff: Error re-fetching updated user details", finalUserFetchError);
        return NextResponse.json({ error: "Update processed, but failed to fetch latest user details." }, { status: 500 });
    }
    
    const responseMember: StaffMember = {
        id: finalUserData.id,
        email: finalUserData.email,
        name: finalStaffData?.name || finalUserData.email?.split('@')[0] || "User",
        username: finalStaffData?.username || undefined, // Username comes from staff table
        phoneNumber: finalStaffData?.phone_number || undefined,
        role: finalUserData.role as StaffMember['role'],
        isAdmin: finalStaffData?.is_admin || (finalUserData.role === "admin" || finalUserData.role === "super_admin"),
        position: finalStaffData?.position || "N/A",
        isActive: finalUserData.is_active,
        created_at: finalUserData.created_at,
        last_updated: finalUserData.last_updated,
    };
    return NextResponse.json(responseMember, { status: 200 });

  } catch (error: any) {
    console.error(`API PUT /api/staff/${staffId} - Unhandled error:`, error);
    return NextResponse.json({ error: 'Failed to process update request: ' + (error.message || "Unknown server error") }, { status: 500 });
  }
}

// You would also create app/api/staff/[staffId]/status/route.ts for PATCH
// or handle status toggle within this PUT handler if staffData includes 'isActive'