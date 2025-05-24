// src/utils/adminUtils.ts (or similar)

import { AdminMember, AdminFormData, FilterOptions } from '../types/admin';

export const filterAdmins = (
  admins: AdminMember[],
  searchTerm: string,
  filterOptions: FilterOptions // This FilterOptions should have positionFilter, not accessLevelFilter
): AdminMember[] => {
  if (!admins) return [];
  let filtered = [...admins];
  
  // Text search filter (general search)
  if (searchTerm && searchTerm.trim()) {
    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(
      (admin) =>
        admin.name.toLowerCase().includes(lowerSearchTerm) ||
        (admin.username ? admin.username.toLowerCase().includes(lowerSearchTerm) : false) ||
        admin.email.toLowerCase().includes(lowerSearchTerm) ||
        (admin.phoneNumber ? admin.phoneNumber.includes(lowerSearchTerm) : false) || // Added phone to general search
        admin.position.toLowerCase().includes(lowerSearchTerm)
    );
  }
  
  // Apply specific filters from advanced filter options
  if (filterOptions.nameFilter && filterOptions.nameFilter.trim()) {
    const lowerNameFilter = filterOptions.nameFilter.trim().toLowerCase();
    filtered = filtered.filter(admin => 
      admin.name.toLowerCase().includes(lowerNameFilter)
    );
  }
  
  if (filterOptions.emailFilter && filterOptions.emailFilter.trim()) {
    const lowerEmailFilter = filterOptions.emailFilter.trim().toLowerCase();
    filtered = filtered.filter(admin => 
      admin.email.toLowerCase().includes(lowerEmailFilter)
    );
  }

  if (filterOptions.usernameFilter && filterOptions.usernameFilter.trim()) {
    const lowerUsernameFilter = filterOptions.usernameFilter.trim().toLowerCase();
    filtered = filtered.filter(admin => 
      admin.username ? admin.username.toLowerCase().includes(lowerUsernameFilter) : false
    );
  }
  
  if (filterOptions.phoneFilter && filterOptions.phoneFilter.trim()) {
    const phoneFilterValue = filterOptions.phoneFilter.trim();
    filtered = filtered.filter(admin => 
      admin.phoneNumber ? admin.phoneNumber.includes(phoneFilterValue) : false
    );
  }
  
  // Role filter (e.g., 'admin', 'super_admin')
  if (filterOptions.roleFilter) { 
    filtered = filtered.filter(admin => admin.role === filterOptions.roleFilter);
  }
  
  // Position filter (Access Level)
  // VVVVVV CORRECTED: Use positionFilter and admin.position VVVVVV
  if (filterOptions.positionFilter) { 
    filtered = filtered.filter(admin => admin.position === filterOptions.positionFilter);
  }
  // ^^^^^^ CORRECTED ^^^^^^

  // isActive filter
  if (filterOptions.isActiveFilter && filterOptions.isActiveFilter !== 'all') {
    filtered = filtered.filter(admin => 
        filterOptions.isActiveFilter === 'active' ? admin.isActive : !admin.isActive
    );
  }
  
  // Sort the filtered data
  if (filterOptions.sortField) {
    const sortable = [...filtered];
    sortable.sort((a, b) => {
      const valA = a[filterOptions.sortField as keyof AdminMember];
      const valB = b[filterOptions.sortField as keyof AdminMember];

      const fieldA = typeof valA === 'string' ? valA.toLowerCase() : 
                     typeof valA === 'number' ? valA :
                     typeof valA === 'boolean' ? String(valA) : ''; 
      const fieldB = typeof valB === 'string' ? valB.toLowerCase() : 
                     typeof valB === 'number' ? valB :
                     typeof valB === 'boolean' ? String(valB) : '';
      
      let comparison = 0;
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        comparison = fieldA.localeCompare(fieldB);
      } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        comparison = fieldA - fieldB;
      }

      return filterOptions.sortDirection === 'asc' ? comparison : -comparison;
    });
    filtered = sortable;
  }
  
  return filtered;
};

// Helper to get empty form data, aligning with AdminFormData
export const getEmptyAdminFormData = (): Omit<AdminFormData, 'id'> => ({
  name: "",
  username: "",
  email: "",
  phoneNumber: "",
  role: "Admin", // Default role for new admins created via typical AdminForm
  password: "",
  confirmPassword: "",
  position: "" // This is for Access Level
});