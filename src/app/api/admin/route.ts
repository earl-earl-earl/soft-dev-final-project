// app/api/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AdminMember, AdminFormData } from '../../../types/admin'; // Adjust the path as needed

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

// GET Handler: Lists all users with 'admin' or 'super_admin' role (REQ-ADMINUSR-01)
export async function GET() {
  try {
    const { data: adminUsers, error: usersError } = await supabaseAdminClient
      .from("users")
      .select('id, email, role, is_active, created_at, last_updated') // username is not in users table
      .in("role", ["admin", "super_admin"]); // Lowercase to match DB enum values

    if (usersError) {
      console.error("API GET /api/admin: Error fetching admin users:", usersError.message);
      return NextResponse.json({ error: `DB error fetching admin users: ${usersError.message}` }, { status: 500 });
    }
    
    if (!adminUsers || adminUsers.length === 0) {
      return NextResponse.json([], { status: 200 }); 
    }
    
    const userIds = adminUsers.map(user => user.id);
    let staffProfilesData: any[] = []; 
    if (userIds.length > 0) {
        const { data: profiles, error: staffProfilesError } = await supabaseAdminClient
            .from("staff") // Admins and Super Admins also have profiles in the 'staff' table
            .select('user_id, name, username, phone_number, position, is_admin') 
            .in('user_id', userIds);
        if (staffProfilesError) {
            console.error("API GET /api/admin: Error fetching staff profiles for admins:", staffProfilesError.message);
            // Consider how critical staff profile is; returning partial data or full error
            return NextResponse.json({ error: `DB error fetching staff profiles: ${staffProfilesError.message}` }, { status: 500 });
        }
        staffProfilesData = profiles || [];
    }
    
    const staffProfileMap = new Map(staffProfilesData.map(p => [p.user_id, p]));
    
    const combinedList: AdminMember[] = adminUsers.map(user => {
      const profile = staffProfileMap.get(user.id);
      return {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.email?.split('@')[0] || "N/A",
        username: profile?.username || undefined, // from staff table
        phoneNumber: profile?.phone_number || undefined,
        role: user.role as AdminMember['role'], 
        isAdmin: true, // For 'admin' and 'super_admin' roles, this should be true
        position: profile?.position || "N/A", // This is the "Access Level"
        isActive: typeof user.is_active === 'boolean' ? user.is_active : true,
        created_at: user.created_at,
        last_updated: user.last_updated,
      };
    });
    
    return NextResponse.json(combinedList, { status: 200 });
  } catch (err: any) {
    console.error("API GET /api/admin - Unhandled error:", err);
    return NextResponse.json({ error: err.message || "An unknown server error occurred." }, { status: 500 });
  }
}

// POST Handler: Creates a new Admin user (REQ-ADMINUSR-02, 03, 09, 10)
// This endpoint typically creates users with the 'admin' role.
// Super Admin creation might be a more restricted process.
export async function POST(request: NextRequest) {
  try {
    const adminData = (await request.json()) as AdminFormData;

    // Server-Side Validation
    if (!adminData.email || !adminData.password || !adminData.name || !adminData.position || !adminData.role) {
      return NextResponse.json({ error: 'Email, password, name, role, and position (access level) are required.' }, { status: 400 });
    }

    const passwordPolicy = validatePasswordPolicy(adminData.password);
    if (!passwordPolicy.isValid) {
        return NextResponse.json({ 
            error: `Password does not meet policy. Must: ${passwordPolicy.messages.join(', ')}.`, 
            formErrors: { password: `Password must: ${passwordPolicy.messages.join(', ')}.`} 
        }, { status: 400 });
    }

    // Ensure the role being set is 'admin' (lowercase for DB) if this API is for creating standard admins.
    // If AdminForm sends "Admin", convert to "admin".
    let dbUserRole = adminData.role.toLowerCase(); 
    if (dbUserRole !== 'admin') { 
        // This specific API endpoint should likely only create 'admin' roles.
        // Super Admin creation might be handled by a different, more privileged endpoint or process.
        console.warn(`API POST /api/admin: Received role '${adminData.role}', forcing to 'admin' for DB.`);
        dbUserRole = 'admin'; 
        // Alternatively, return an error if only 'admin' is allowed through this form/API:
        // return NextResponse.json({ error: "Invalid role specified. This form creates 'Admin' users." }, { status: 400 });
    }

    let authUserId: string | undefined = undefined;

    // 1. Create Supabase Auth user
    const { data: authUserResponse, error: authError } = await supabaseAdminClient.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true, // Auto-confirms with admin client
      user_metadata: { full_name: adminData.name, app_role: dbUserRole, display_username: adminData.username || '' }
    });

    if (authError || !authUserResponse?.user) {
      console.error("API POST /api/admin - Supabase auth.admin.createUser error:", authError);
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
        email: adminData.email, 
        role: dbUserRole, // 'admin'
        is_active: true, 
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      })
      .select('id, email, role, is_active, created_at, last_updated')
      .single();

    if (publicUserError) {
      console.error("API POST /api/admin - Error inserting into public.users:", publicUserError);
      if (authUserId) await supabaseAdminClient.auth.admin.deleteUser(authUserId); 
      return NextResponse.json({ error: publicUserError.message || 'Failed to create user profile.' }, { status: 500 });
    }
    if (!newUserEntry) {
        if (authUserId) await supabaseAdminClient.auth.admin.deleteUser(authUserId);
        return NextResponse.json({ error: "Failed to retrieve created user profile from 'users' table." }, { status: 500 });
    }
    
    // 3. Insert into public.staff table (Admins also have a staff profile)
    const { data: staffTableEntry, error: staffError } = await supabaseAdminClient
      .from('staff')
      .insert({
        user_id: authUserId, 
        name: adminData.name,
        username: adminData.username || null, 
        phone_number: adminData.phoneNumber || null,
        position: adminData.position, // This is the AccessLevel
        is_admin: true, // Admins created here ALWAYS have staff.is_admin = true
      })
      .select() 
      .single();

    if (staffError) {
      console.error("API POST /api/admin - Error inserting into public.staff:", staffError);
      if (authUserId) { 
        await supabaseAdminClient.from('users').delete().eq('id', authUserId);
        await supabaseAdminClient.auth.admin.deleteUser(authUserId);
      }
       if (staffError.code === '23505' && (staffError.message.includes('staff_username_key') || staffError.message.includes('staff_username_idx'))) {
           return NextResponse.json({ error: "Username already exists in staff profiles.", formErrors: { username: "Username already taken."}}, { status: 409 });
      }
      return NextResponse.json({ error: staffError.message || 'Failed to create admin staff details.' }, { status: 500 });
    }
    if (!staffTableEntry) {
        if (authUserId) { /* Full Rollback */ }
        return NextResponse.json({ error: "Failed to retrieve created staff profile for admin." }, { status: 500 });
    }

    const createdAdminMember: AdminMember = {
      id: authUserId,
      email: newUserEntry.email,
      name: staffTableEntry.name,
      username: staffTableEntry.username || undefined,
      phoneNumber: staffTableEntry.phone_number || undefined,
      role: newUserEntry.role as AdminMember['role'],
      isAdmin: staffTableEntry.is_admin, // Will be true
      position: staffTableEntry.position,
      isActive: newUserEntry.is_active, 
      created_at: newUserEntry.created_at,
      last_updated: newUserEntry.last_updated,
    };

    return NextResponse.json(createdAdminMember, { status: 201 });

  } catch (error: any) {
    console.error("API POST /api/admin - Unhandled error:", error);
    return NextResponse.json({ error: 'Failed to process admin creation: ' + error.message }, { status: 500 });
  }
}