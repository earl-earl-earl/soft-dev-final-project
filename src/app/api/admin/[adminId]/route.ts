import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AdminFormData, AdminMember } from '../../../../types/admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);

// Password policy validation helper (consistent with your other API routes)
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
  params: {
    adminId: string; // This will be the user ID (auth.users.id)
  }
}

// --- PUT Handler (Update Admin User Details) ---
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { adminId } = params;
  if (!adminId) {
    return NextResponse.json({ error: 'Admin User ID is required in the path.' }, { status: 400 });
  }
  console.log(`API PUT /api/admin/${adminId}: Received update request.`);

  try {
    const adminData = (await request.json()) as Partial<AdminFormData>;
    console.log(`API PUT /api/admin/${adminId}: Received data:`, adminData);

    // --- TODO: AUTHORIZATION CHECK ---
    // - Get the role of the user making this request (e.g., from their session/JWT).
    // - Get the role of the admin being edited (`adminId`).
    // - REQ-ADMINUSR-07: 'admin' cannot modify other 'admin' or 'super_admin' (unless it's themselves).
    // - REQ-ADMINUSR-13: Only 'super_admin' can edit 'admin' or 'super_admin' roles.
    // - REQ-ADMINUSR-14: 'super_admin' account modification is highly restricted (this API might not allow it at all for certain fields).
    // Example placeholder:
    // const { data: targetUser, error: targetUserError } = await supabaseAdminClient.from('users').select('role').eq('id', adminId).single();
    // if (targetUserError || !targetUser) return NextResponse.json({ error: 'Target admin user not found.' }, { status: 404 });
    // if (currentUserRole === 'admin' && (targetUser.role === 'admin' || targetUser.role === 'super_admin') && currentUserId !== adminId) {
    //   return NextResponse.json({ error: 'Permission denied to modify this admin account.' }, { status: 403 });
    // }
    // if (targetUser.role === 'super_admin' && currentUserRole !== 'super_admin') {
    //   return NextResponse.json({ error: 'Only Super Admins can modify Super Admin accounts.' }, { status: 403 });
    // }
    // --- END AUTHORIZATION CHECK PLACEHOLDER ---

    // 1. Update Supabase Auth User (Password if provided)
    if (adminData.password && adminData.password.length > 0) {
      const passwordPolicyCheck = validatePasswordPolicyOnServer(adminData.password);
      if (!passwordPolicyCheck.isValid) {
          return NextResponse.json({ 
              error: `New password does not meet policy. Must: ${passwordPolicyCheck.messages.join(', ')}.`, 
              formErrors: { password: `Password must: ${passwordPolicyCheck.messages.join(', ')}.`} 
          }, { status: 400 });
      }
      console.log(`API PUT /api/admin/${adminId}: Attempting to update auth password.`);
      const { error: authPasswordError } = await supabaseAdminClient.auth.admin.updateUserById(
        adminId, { password: adminData.password }
      );
      if (authPasswordError) {
        console.error(`API PUT /api/admin/${adminId}: Supabase auth password update error:`, authPasswordError);
        return NextResponse.json({ error: `Failed to update password: ${authPasswordError.message}` }, { status: 500 });
      }
      console.log(`API PUT /api/admin/${adminId}: Auth password updated successfully.`);
    }

    // 2. Update public.users table
    const userUpdatePayload: Partial<{ role: string; email: string; last_updated: string; /* username? */ }> = {
      last_updated: new Date().toISOString()
    };
    let userTableNeedsUpdate = Object.keys(adminData).some(key => ['role', 'email'].includes(key)); // Check if relevant fields are present

    if (adminData.role !== undefined) {
      const dbUserRole = adminData.role.toLowerCase();
      if (dbUserRole === 'admin' || dbUserRole === 'super_admin') { // Only allow update to admin-type roles
          userUpdatePayload.role = dbUserRole;
      } else {
          console.warn(`API PUT /api/admin/${adminId}: Invalid role for update: ${adminData.role}`);
          return NextResponse.json({ error: 'Invalid target role for an admin user.' }, { status: 400 });
      }
    }
    // Email for Supabase Auth users is updated via supabase.auth.admin.updateUserById if needed,
    // but that triggers confirmation emails. Usually, the primary email isn't changed via forms like this.
    // If staffData.email is for a secondary/display email in users table:
    // if (adminData.email !== undefined) { userUpdatePayload.email = adminData.email; }

    if (Object.keys(userUpdatePayload).length > 1) { // If more than just last_updated
      console.log(`API PUT /api/admin/${adminId}: Updating public.users with payload:`, userUpdatePayload);
      const { error: publicUserUpdateError } = await supabaseAdminClient
        .from('users').update(userUpdatePayload).eq('id', adminId);
      if (publicUserUpdateError) {
        console.error(`API PUT /api/admin/${adminId}: Error updating public.users:`, publicUserUpdateError);
        return NextResponse.json({ error: `Failed to update user core info: ${publicUserUpdateError.message}` }, { status: 500 });
      }
      console.log(`API PUT /api/admin/${adminId}: public.users updated successfully.`);
    }

    // 3. Update public.staff table (Admins have a staff profile)
    const staffProfileUpdatePayload: Partial<{ name: string; username: string | null; phone_number: string | null; position: string; is_admin: boolean }> = {};
    let staffProfileNeedsUpdate = false;

    if (adminData.name !== undefined) { staffProfileUpdatePayload.name = adminData.name; staffProfileNeedsUpdate = true; }
    if (adminData.username !== undefined) { staffProfileUpdatePayload.username = adminData.username || null; staffProfileNeedsUpdate = true; }
    if (adminData.phoneNumber !== undefined) { staffProfileUpdatePayload.phone_number = adminData.phoneNumber || null; staffProfileNeedsUpdate = true; }
    if (adminData.position !== undefined) { staffProfileUpdatePayload.position = adminData.position; staffProfileNeedsUpdate = true; }
    // is_admin for 'admin' or 'super_admin' roles should always be true.
    // If role changes (handled above), is_admin in staff table should reflect that.
    // If adminData.role was updated to 'admin' or 'super_admin', ensure is_admin is true.
    if (userUpdatePayload.role) { // If role was part of the update
        staffProfileUpdatePayload.is_admin = (userUpdatePayload.role === 'admin' || userUpdatePayload.role === 'super_admin');
        staffProfileNeedsUpdate = true;
    }


    if (staffProfileNeedsUpdate) {
      console.log(`API PUT /api/admin/${adminId}: Updating public.staff with payload:`, staffProfileUpdatePayload);
      const { error: staffError } = await supabaseAdminClient
        .from('staff').update(staffProfileUpdatePayload).eq('user_id', adminId);
      if (staffError) {
        console.error(`API PUT /api/admin/${adminId}: Error updating public.staff:`, staffError);
        if (staffError.code === '23505' && (staffError.message.includes('staff_username_key') || staffError.message.includes('staff_username_idx'))) {
           return NextResponse.json({ error: "Username already taken in staff profile.", formErrors: { username: "Username already taken."}}, { status: 409 });
        }
        return NextResponse.json({ error: `Failed to update admin's staff profile: ${staffError.message}` }, { status: 500 });
      }
      console.log(`API PUT /api/admin/${adminId}: public.staff updated successfully.`);
    }

    // Fetch the combined, updated AdminMember data to return
    const { data: finalUserData, error: finalUserFetchError } = await supabaseAdminClient.from("users").select('id, email, role, is_active, created_at, last_updated').eq('id', adminId).single();
    const { data: finalStaffData, error: finalStaffFetchError } = await supabaseAdminClient.from("staff").select('user_id, name, username, phone_number, position, is_admin').eq('user_id', adminId).single();

    if (finalUserFetchError || !finalUserData ) {
        return NextResponse.json({ error: "Failed to retrieve updated admin user details." }, { status: 500 });
    }
    
    const responseMember: AdminMember = {
        id: finalUserData.id,
        email: finalUserData.email,
        name: finalStaffData?.name || finalUserData.email?.split('@')[0] || "Admin",
        username: finalStaffData?.username || undefined,
        phoneNumber: finalStaffData?.phone_number || undefined,
        role: finalUserData.role as AdminMember['role'],
        isAdmin: finalStaffData?.is_admin !== undefined ? finalStaffData.is_admin : true, // Default to true for admins
        position: finalStaffData?.position || "N/A",
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


// --- PATCH Handler (Toggle Admin User Status) ---
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { adminId } = params;
  if (!adminId) {
    return NextResponse.json({ error: 'Admin User ID is required.' }, { status: 400 });
  }
  console.log(`API PATCH /api/admin/${adminId}/status: Received status toggle request.`);

  try {
    const { isActive } = (await request.json()) as { isActive: boolean }; // Expecting { isActive: true/false }
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: "'isActive' (boolean) field is required in the request body." }, { status: 400 });
    }

    // --- TODO: AUTHORIZATION CHECK (REQ-ADMINUSR-07, REQ-ADMINUSR-13, REQ-ADMINUSR-14) ---
    // - Get current user's role (from session/token).
    // - Get target user's role (`adminId`).
    // - If targetUser.role === 'super_admin', only allow if current user is also 'super_admin' AND it's not self-deactivation (REQ-ADMINUSR-14).
    // - If targetUser.role === 'admin', only allow if current user is 'super_admin' (or if it's self-deactivation, though SRS implies admins can't deactivate admins).
    // Example placeholder:
    // const { data: targetUser, error: targetUserError } = await supabaseAdminClient.from('users').select('role').eq('id', adminId).single();
    // if (targetUserError || !targetUser) return NextResponse.json({ error: 'Target admin user not found.' }, { status: 404 });
    // if (targetUser.role === 'super_admin') return NextResponse.json({ error: 'Super admin status cannot be changed via API.' }, { status: 403 });
    // if (currentUserRole === 'admin' && targetUser.role === 'admin') return NextResponse.json({ error: 'Admins cannot change status of other admins.' }, { status: 403 });
    // --- END AUTHORIZATION CHECK PLACEHOLDER ---

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

    console.log(`API PATCH /api/admin/${adminId}/status: Status updated successfully to ${isActive}.`);
    return NextResponse.json({ message: `Admin user status successfully updated to ${isActive ? 'Active' : 'Inactive'}.` }, { status: 200 });

  } catch (error: any) {
    console.error(`API PATCH /api/admin/${adminId}/status - Unhandled error:`, error);
    return NextResponse.json({ error: 'Failed to process status toggle: ' + (error.message || "Unknown server error") }, { status: 500 });
  }
}