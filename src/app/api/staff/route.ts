// app/api/staff/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { StaffMember, StaffFormData } from '../../../types/staff';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);

// Password policy validation helper (REQ-ADMINUSR-10)
const validatePasswordPolicy = (password: string): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  if (password.length < 8) messages.push("be at least 8 characters");
  if (!/[A-Z]/.test(password)) messages.push("contain an uppercase letter");
  if (!/[a-z]/.test(password)) messages.push("contain a lowercase letter");
  if (!/[0-9]/.test(password)) messages.push("contain a number");
  if (!/[^A-Za-z0-9]/.test(password)) messages.push("contain a special character (e.g., !@#$%)");
  return { isValid: messages.length === 0, messages };
};

// GET Handler: Lists all users with 'staff' or 'admin' role (REQ-ADMINUSR-01)
export async function GET() {
  try {
    // Fetch users who are 'staff' or 'admin' (as per SRS for User Management list)
    const { data: users, error: usersError } = await supabaseAdminClient
      .from("users")
      .select('id, email, role, is_active, created_at, last_updated')
      .in("role", ["staff"]); // Lowercase to match DB enum values

    if (usersError) {
      console.error("API GET /api/staff: Error fetching users:", usersError.message);
      return NextResponse.json({ error: `DB error fetching users: ${usersError.message}` }, { status: 500 });
    }
    
    if (!users || users.length === 0) {
      return NextResponse.json([], { status: 200 }); 
    }
    
    const userIds = users.map(user => user.id);
    let staffProfilesData: any[] = []; 
    if (userIds.length > 0) {
        const { data: profiles, error: staffProfilesError } = await supabaseAdminClient
            .from("staff")
            .select('user_id, name, username, phone_number, position, is_admin') 
            .in('user_id', userIds);
        if (staffProfilesError) throw staffProfilesError; // Let main catch block handle
        staffProfilesData = profiles || [];
    }
    
    const staffProfileMap = new Map(staffProfilesData.map(p => [p.user_id, p]));
    
    const combinedList: StaffMember[] = users.map(user => {
      const profile = staffProfileMap.get(user.id);
      return {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.email?.split('@')[0] || "N/A",
        username: profile?.username || undefined,
        phoneNumber: profile?.phone_number || undefined,
        role: user.role as StaffMember['role'], // From users table
        isAdmin: profile?.is_admin || false, // Should align with role from users table
        position: profile?.position || "N/A",
        isActive: typeof user.is_active === 'boolean' ? user.is_active : true,
        created_at: user.created_at,
        last_updated: user.last_updated,
      };
    });
    
    return NextResponse.json(combinedList, { status: 200 });
  } catch (err: any) {
    console.error("API GET /api/staff - Unhandled error:", err);
    return NextResponse.json({ error: err.message || "An unknown server error occurred." }, { status: 500 });
  }
}

// POST Handler: Creates a new Staff or Admin user (REQ-ADMINUSR-02, 03, 09, 10)
export async function POST(request: NextRequest) {
  try {
    const staffData = (await request.json()) as StaffFormData;

    // --- Server-Side Validation ---
    if (!staffData.email || !staffData.password || !staffData.name || !staffData.position || !staffData.role) {
      return NextResponse.json({ error: 'Email, password, name, role, and position are required.' }, { status: 400 });
    }

    const passwordPolicy = validatePasswordPolicy(staffData.password);
    if (!passwordPolicy.isValid) {
        return NextResponse.json({ 
            error: `Password does not meet policy. Must: ${passwordPolicy.messages.join(', ')}.`, 
            formErrors: { password: `Password must: ${passwordPolicy.messages.join(', ')}.`} 
        }, { status: 400 });
    }

    // Map form role (e.g., "Staff", "Admin") to DB enum role (e.g., "staff", "admin")
    const dbUserRole = staffData.role.toLowerCase(); 
    if (dbUserRole !== 'staff' && dbUserRole !== 'admin') {
        return NextResponse.json({ error: "Invalid role specified. Must be 'Staff' or 'Admin'." }, { status: 400 });
    }
    // staffData.isAdmin is derived in the form and should align with dbUserRole

    let authUserId: string | undefined = undefined;

    // 1. Create Supabase Auth user
    const { data: authUserResponse, error: authError } = await supabaseAdminClient.auth.admin.createUser({
      email: staffData.email,
      password: staffData.password,
      email_confirm: true, // As per your last successful finding, this auto-confirms with admin client
      user_metadata: { full_name: staffData.name, app_role: dbUserRole }
    });

    if (authError || !authUserResponse?.user) {
      console.error("API POST /api/staff - Supabase auth.admin.createUser error:", authError);
      if (authError?.message.toLowerCase().includes("user already registered")) {
        return NextResponse.json({ error: 'This email address is already registered.', formErrors: { email: 'Email already registered.' } }, { status: 409 });
      }
      return NextResponse.json({ error: authError?.message || 'Failed to create authentication user.' }, { status: 500 });
    }
    authUserId = authUserResponse.user.id;

    // 2. Insert into public.users table
    const { data: newUserEntry, error: publicUserError } = await supabaseAdminClient
      .from('users')
      .insert({
        id: authUserId, 
        email: staffData.email, 
        role: dbUserRole, 
        is_active: true, // REQ-ADMINUSR-03: active by default
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        // username: staffData.username || null, // If you add 'username' to 'users' table
      })
      .select('id, email, role, is_active, created_at, last_updated')
      .single();

    if (publicUserError) {
      console.error("API POST /api/staff - Error inserting into public.users:", publicUserError);
      if (authUserId) await supabaseAdminClient.auth.admin.deleteUser(authUserId); 
      // REQ-ADMINUSR-09 check (if username was in users table and unique)
      // if (publicUserError.code === '23505' && publicUserError.message.includes('username_constraint_name')) {
      //      return NextResponse.json({ error: "Username already exists.", formErrors: { username: "Username already exists."}}, { status: 409 });
      // }
      return NextResponse.json({ error: publicUserError.message || 'Failed to create user profile.' }, { status: 500 });
    }
    if (!newUserEntry) { /* Should not happen if insert was successful */
        if (authUserId) await supabaseAdminClient.auth.admin.deleteUser(authUserId);
        return NextResponse.json({ error: "Failed to retrieve created user profile from 'users' table." }, { status: 500 });
    }
    
    // 3. Insert into public.staff table
    const { data: staffTableEntry, error: staffError } = await supabaseAdminClient
      .from('staff')
      .insert({
        user_id: authUserId, 
        name: staffData.name,
        username: staffData.username || null, 
        phone_number: staffData.phoneNumber || null,
        position: staffData.position,
        is_admin: staffData.isAdmin, // Derived from role in StaffForm
      })
      .select() 
      .single();

    if (staffError) {
      console.error("API POST /api/staff - Error inserting into public.staff:", staffError);
      if (authUserId) { 
        await supabaseAdminClient.from('users').delete().eq('id', authUserId);
        await supabaseAdminClient.auth.admin.deleteUser(authUserId);
      }
      // REQ-ADMINUSR-09 check (if username is in staff table and unique)
       if (staffError.code === '23505' && (staffError.message.includes('staff_username_key') || staffError.message.includes('staff_username_idx'))) {
           return NextResponse.json({ error: "Username already exists in staff profiles.", formErrors: { username: "Username already exists."}}, { status: 409 });
      }
      return NextResponse.json({ error: staffError.message || 'Failed to create staff details.' }, { status: 500 });
    }
     if (!staffTableEntry) { /* Should not happen */
        if (authUserId) { /* Rollback */ }
        return NextResponse.json({ error: "Failed to retrieve created staff profile." }, { status: 500 });
    }

    const createdStaffMember: StaffMember = {
      id: authUserId,
      email: newUserEntry.email,
      name: staffTableEntry.name,
      username: staffTableEntry.username || undefined,
      phoneNumber: staffTableEntry.phone_number || undefined,
      role: newUserEntry.role as StaffMember['role'],
      isAdmin: staffTableEntry.is_admin,
      position: staffTableEntry.position,
      isActive: newUserEntry.is_active, 
      created_at: newUserEntry.created_at,
      last_updated: newUserEntry.last_updated,
    };

    return NextResponse.json(createdStaffMember, { status: 201 });

  } catch (error: any) {
    console.error("API POST /api/staff - Unhandled error:", error);
    return NextResponse.json({ error: 'Failed to process staff creation: ' + error.message }, { status: 500 });
  }
}