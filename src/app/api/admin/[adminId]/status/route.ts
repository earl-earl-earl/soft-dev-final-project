// app/api/admin/[adminId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AdminFormData, AdminMember } from '../../../../../types/admin'; // Adjust path if needed

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);

// Password policy validation helper
const validatePasswordPolicyOnServer = (password: string): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  if (password.length < 8) messages.push("be at least 8 characters");
  if (!/[A-Z]/.test(password)) messages.push("contain an uppercase letter");
  // ... (rest of policy checks)
  if (!/[a-z]/.test(password)) messages.push("contain a lowercase letter");
  if (!/[0-9]/.test(password)) messages.push("contain a number");
  if (!/[^A-Za-z0-9]/.test(password)) messages.push("contain a special character");
  return { isValid: messages.length === 0, messages };
};

interface RouteContext {
  params: { adminId: string; }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { adminId } = params;
  if (!adminId) {
    return NextResponse.json({ error: 'Admin User ID is required.' }, { status: 400 });
  }
  console.log(`API PUT /api/admin/${adminId}: Received update request.`);

  try {
    const adminData = (await request.json()) as Partial<AdminFormData>;
    console.log(`API PUT /api/admin/${adminId}: Received data:`, adminData);

    // --- TODO: AUTHORIZATION CHECK ---
    // (Same authorization logic as described in the previous combined file)
    // - Get current user's role
    // - Get target user's role
    // - Enforce REQ-ADMINUSR-07, REQ-ADMINUSR-13, REQ-ADMINUSR-14
    // --- END AUTHORIZATION ---

    // 1. Update Supabase Auth User (Password if provided)
    if (adminData.password && adminData.password.length > 0) {
      // ... (password policy validation and auth.admin.updateUserById logic) ...
      const passwordPolicyCheck = validatePasswordPolicyOnServer(adminData.password);
      if (!passwordPolicyCheck.isValid) { /* ... return error ... */ }
      const { error: authPasswordError } = await supabaseAdminClient.auth.admin.updateUserById(
        adminId, { password: adminData.password }
      );
      if (authPasswordError) { /* ... return error ... */ }
    }

    // 2. Update public.users table
    const userUpdatePayload: Partial<{ role: string; email: string; last_updated: string; /* username? */ }> = {
      last_updated: new Date().toISOString()
    };
    let userTableNeedsUpdate = false; // Flag to see if we actually need to call update
    if (adminData.role !== undefined) {
      const dbUserRole = adminData.role.toLowerCase();
      if (dbUserRole === 'admin' || dbUserRole === 'super_admin') {
          userUpdatePayload.role = dbUserRole;
          userTableNeedsUpdate = true;
      } else { /* handle invalid role for update */ }
    }
    // Email is generally not changed for auth users easily.
    // If adminData.username is for users.username:
    // if (adminData.username !== undefined) { userUpdatePayload.username = adminData.username; userTableNeedsUpdate = true; }


    if (userTableNeedsUpdate) { // Only update if there are changes other than last_updated or if explicitly needed
      const { error: publicUserUpdateError } = await supabaseAdminClient
        .from('users').update(userUpdatePayload).eq('id', adminId);
      if (publicUserUpdateError) { /* ... return error ... */ }
    }

    // 3. Update public.staff table
    const staffProfileUpdatePayload: Partial<{ name: string; username: string | null; phone_number: string | null; position: string; is_admin: boolean }> = {};
    let staffProfileNeedsUpdate = false;
    if (adminData.name !== undefined) { staffProfileUpdatePayload.name = adminData.name; staffProfileNeedsUpdate = true;}
    if (adminData.username !== undefined) { staffProfileUpdatePayload.username = adminData.username || null; staffProfileNeedsUpdate = true;}
    if (adminData.phoneNumber !== undefined) { staffProfileUpdatePayload.phone_number = adminData.phoneNumber || null; staffProfileNeedsUpdate = true;}
    if (adminData.position !== undefined) { staffProfileUpdatePayload.position = adminData.position; staffProfileNeedsUpdate = true;}
    // is_admin should be true if role is 'admin' or 'super_admin'
    if (userUpdatePayload.role) { // If role was changed
        staffProfileUpdatePayload.is_admin = (userUpdatePayload.role === 'admin' || userUpdatePayload.role === 'super_admin');
        staffProfileNeedsUpdate = true;
    } else if (adminData.role && !userUpdatePayload.role) { // If role came in adminData but wasn't set for userUpdate (e.g. already correct)
        staffProfileUpdatePayload.is_admin = (adminData.role.toLowerCase() === 'admin' || adminData.role.toLowerCase() === 'super_admin');
        staffProfileNeedsUpdate = true;
    }


    if (staffProfileNeedsUpdate) {
      const { error: staffError } = await supabaseAdminClient
        .from('staff').update(staffProfileUpdatePayload).eq('user_id', adminId);
      if (staffError) { /* ... return error, handle unique username ... */ }
    }

    // Fetch the combined, updated AdminMember data to return
    const { data: finalUserData, error: finalUserFetchError } = await supabaseAdminClient.from("users").select('id, email, role, is_active, created_at, last_updated').eq('id', adminId).single();
    const { data: finalStaffData, error: finalStaffFetchError } = await supabaseAdminClient.from("staff").select('user_id, name, username, phone_number, position, is_admin').eq('user_id', adminId).single();

    if (finalUserFetchError || !finalUserData) {
      return NextResponse.json({ error: 'Failed to fetch updated user data.' }, { status: 500 });
    }
    if (finalStaffFetchError || !finalStaffData) {
      return NextResponse.json({ error: 'Failed to fetch updated staff data.' }, { status: 500 });
    }

    const responseMember: AdminMember = { 
        id: finalUserData.id,
        email: finalUserData.email,
        name: finalStaffData.name || finalUserData.email?.split('@')[0] || "Admin User",
        username: finalStaffData.username || undefined,
        phoneNumber: finalStaffData.phone_number || undefined,
        role: finalUserData.role as AdminMember['role'],
        isAdmin: finalStaffData.is_admin !== undefined ? finalStaffData.is_admin : true,
        position: finalStaffData.position || "N/A",
        isActive: finalUserData.is_active,
        created_at: finalUserData.created_at,
        last_updated: finalUserData.last_updated,
    };
    return NextResponse.json(responseMember, { status: 200 });

  } catch (error: any) {
    console.error(`API PUT /api/admin/${adminId} - Unhandled error:`, error);
    return NextResponse.json({ error: 'Failed to process admin update: ' + (error.message || "Unknown server error") }, { status: 500 });
  }
}