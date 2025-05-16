import { AdminFormData, AdminMember, FilterOptions } from "../types/admin";

export const filterAdmins = (
  admins: AdminMember[],
  searchTerm: string,
  filterOptions: FilterOptions
): AdminMember[] => {
  let filtered = [...admins];
  
  // Text search filter
  if (searchTerm.trim()) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (admin) =>
        admin.name.toLowerCase().includes(lowerSearchTerm) ||
        admin.username.toLowerCase().includes(lowerSearchTerm) ||
        admin.email.toLowerCase().includes(lowerSearchTerm)
    );
  }
  
  // Apply specific filters
  if (filterOptions.nameFilter.trim()) {
    const lowerNameFilter = filterOptions.nameFilter.toLowerCase();
    filtered = filtered.filter(admin => 
      admin.name.toLowerCase().includes(lowerNameFilter)
    );
  }
  
  if (filterOptions.emailFilter.trim()) {
    const lowerEmailFilter = filterOptions.emailFilter.toLowerCase();
    filtered = filtered.filter(admin => 
      admin.email.toLowerCase().includes(lowerEmailFilter)
    );
  }
  
  if (filterOptions.phoneFilter.trim()) {
    filtered = filtered.filter(admin => 
      admin.phoneNumber.includes(filterOptions.phoneFilter)
    );
  }
  
  if (filterOptions.roleFilter) {
    filtered = filtered.filter(admin => admin.role === filterOptions.roleFilter);
  }
  
  if (filterOptions.accessLevelFilter) {
    filtered = filtered.filter(admin => admin.accessLevel === filterOptions.accessLevelFilter);
  }
  
  // Sort the filtered data
  if (filterOptions.sortField) {
    filtered.sort((a, b) => {
      const fieldA = (a[filterOptions.sortField as keyof AdminMember] as string).toLowerCase();
      const fieldB = (b[filterOptions.sortField as keyof AdminMember] as string).toLowerCase();
      
      if (filterOptions.sortDirection === 'asc') {
        return fieldA.localeCompare(fieldB);
      } else {
        return fieldB.localeCompare(fieldA);
      }
    });
  }
  
  return filtered;
};

export const getEmptyAdminForm = (): Omit<AdminFormData, 'id'> => ({
  username: "",
  name: "",
  email: "",
  phoneNumber: "",
  role: "admin",
  accessLevel: "",
  password: "",
  confirmPassword: ""
});