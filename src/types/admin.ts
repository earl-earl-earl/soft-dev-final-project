// src/types/admin.ts

/**
 * Represents an Admin or Super Admin user as displayed in the UI.
 * These users are Supabase Auth users and have corresponding entries
 * in the 'public.users' and 'public.staff' tables.
 */
export interface AdminMember {
  id: string;           // users.id (UUID, same as auth.users.id)
  name: string;
  email: string;        // users.email (PRIMARY IDENTIFIER from auth.users)
  username?: string;     // staff.username (Optional display/vanity username)
  phoneNumber?: string;
  role: 'admin' | 'super_admin' | string;
  position: string;     // staff.position (This is the "Access Level" for admins)
  isAdmin: true;
  isActive: boolean;
  created_at?: string;
  last_updated?: string;
}
export interface AdminFormData {
  id?: string;          // For updates, refers to users.id / auth.users.id
  name: string;
  email: string;
  username?: string;
  phoneNumber?: string;
  password?: string;       // Required for new users; optional for edits
  confirmPassword?: string; // For form validation only
  role: 'Admin' | 'Staff'; // <<<< Values from the ROLES_FOR_FORM constant (Display Values)
  position: string;

  // isAdmin will be derived based on the role before sending to backend or by backend.
  // For example, if role is 'Admin', then staff.is_admin will be true.
  // If role is 'Staff', then staff.is_admin will be false.
}

export interface FilterOptions {
  accessLevelFilter: string | number | readonly string[] | undefined;
  nameFilter: string;
  emailFilter: string;
  usernameFilter?: string;
  phoneFilter?: string;
  roleFilter: 'admin' | 'super_admin' | ''; // Filter by specific admin-level roles
  positionFilter: string; // Filter by 'position' (Access Level)
  isActiveFilter: 'all' | 'active' | 'inactive';
  sortField: keyof AdminMember | ''; 
  sortDirection: 'asc' | 'desc';
}

export type AccessLevel =
  | "System Administrator"
  | "Content Manager"
  | "User Manager"
  | "Analytics Manager"
  | "Support Administrator";

export const ACCESS_LEVELS: AccessLevel[] = [
  "System Administrator",
  "Content Manager",
  "User Manager",
  "Analytics Manager",
  "Support Administrator"
];

export const ADMIN_FORM_SELECTABLE_ROLES = [
  { value: "admin", label: "Admin" }, // User selects "Admin"
  { value: "staff", label: "Staff" }  // User selects "Staff"
] as const;