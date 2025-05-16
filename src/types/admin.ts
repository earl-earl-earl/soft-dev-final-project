export interface AdminMember {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  accessLevel: string;
  isActive?: boolean;
}

export interface AdminFormData extends Omit<AdminMember, 'id'> {
  password: string;
  confirmPassword: string;
}

export interface FilterOptions {
  nameFilter: string;
  emailFilter: string;
  phoneFilter: string;
  roleFilter: string;
  accessLevelFilter: string;
  sortField: string;
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

export const ADMIN_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" }
];