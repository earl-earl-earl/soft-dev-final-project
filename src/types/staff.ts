// src/types/staff.ts
export interface StaffMember {
  id: string;           // Corresponds to auth.users.id and users.id (UUID string)
  name: string;         // From staff.name
  email: string;        // From users.email (Primary identifier for login)
  username?: string;     // From staff.username (Optional display name)
  phoneNumber?: string;  // From staff.phone_number (optional)
  role: 'staff' | 'admin'; // From users.role
  // position: string;     // From staff.position
  isAdmin: boolean;     // From staff.is_admin (true if role is 'admin', false if 'staff')
  isActive: boolean;    // From users.is_active
  created_at?: string;   // From users.created_at
  last_updated?: string; // From users.last_updated
}

export interface StaffFormData {
  id?: string;           // Refers to users.id
  name: string;
  email: string;        // Required for creating the Supabase Auth user
  username?: string;
  phoneNumber?: string;
  password?: string;       // Required for new users; optional for edits (only if changing password)
  confirmPassword?: string; // For client-side form validation only
  role: 'Staff' | 'Admin';  // User selects "Staff" or "Admin" in the form
                            // This will be mapped to lowercase 'staff' or 'admin' for the database 'users.role'
  isAdmin: boolean;
  // position: string;       // From POSITIONS constant
}

export interface FilterOptions {
  nameFilter: string;
  usernameFilter?: string;
  emailFilter: string;
  phoneFilter?: string;
  roleFilter: 'staff' | 'admin' | '';
  // positionFilter: string;
  isActiveFilter: 'all' | 'active' | 'inactive';
  sortField: keyof StaffMember | '';
  sortDirection: 'asc' | 'desc';
}

export const POSITIONS: readonly string[] = [
  "Staff Manager",
  "Technical Staff",
  "Senior Staff",
  "Junior Staff",
  "Temporary Staff",
  "Trainee"
];

export const ROLES: readonly ['Staff', 'Admin'] = ["Staff", "Admin"];