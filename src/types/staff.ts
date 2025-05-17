export interface StaffMember {
  id: string;
  username: string;
  name: string;
  phoneNumber: string;
  role: string;
  position: string;
  isActive?: boolean;
}

export interface StaffFormData {
  name: string;
  username: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  role: string;
  position: string;
}

export interface FilterOptions {
  nameFilter: string;
  emailFilter: string;
  phoneFilter: string;
  roleFilter: string;
  positionFilter: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

export const POSITIONS = [
  "Staff Manager",
  "Technical Staff",
  "Senior Staff",
  "Junior Staff",
  "Temporary Staff",
  "Trainee"
];

export const ROLES = ["Staff", "Admin"];