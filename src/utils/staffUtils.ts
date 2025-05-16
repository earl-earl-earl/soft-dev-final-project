import { StaffMember, FilterOptions } from '../types/staff';

export const filterStaff = (
  staff: StaffMember[],
  searchTerm: string,
  filterOptions: FilterOptions
): StaffMember[] => {
  let filtered = [...staff];
  
  // Text search filter
  if (searchTerm.trim()) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (staffMember) =>
        staffMember.name.toLowerCase().includes(lowerSearchTerm) ||
        staffMember.username.toLowerCase().includes(lowerSearchTerm) ||
        staffMember.email.toLowerCase().includes(lowerSearchTerm)
    );
  }
  
  // Name filter
  if (filterOptions.nameFilter.trim()) {
    const lowerNameFilter = filterOptions.nameFilter.toLowerCase();
    filtered = filtered.filter(staffMember => 
      staffMember.name.toLowerCase().includes(lowerNameFilter)
    );
  }
  
  // Email filter
  if (filterOptions.emailFilter.trim()) {
    const lowerEmailFilter = filterOptions.emailFilter.toLowerCase();
    filtered = filtered.filter(staffMember => 
      staffMember.email.toLowerCase().includes(lowerEmailFilter)
    );
  }
  
  // Phone filter
  if (filterOptions.phoneFilter.trim()) {
    filtered = filtered.filter(staffMember => 
      staffMember.phoneNumber.includes(filterOptions.phoneFilter)
    );
  }
  
  // Role filter
  if (filterOptions.roleFilter) {
    filtered = filtered.filter(staffMember => staffMember.role === filterOptions.roleFilter);
  }
  
  // Position filter
  if (filterOptions.positionFilter) {
    filtered = filtered.filter(staffMember => staffMember.position === filterOptions.positionFilter);
  }
  
  // Sort the filtered data
  if (filterOptions.sortField) {
    filtered.sort((a, b) => {
      const fieldA = (a[filterOptions.sortField as keyof StaffMember] as string).toLowerCase();
      const fieldB = (b[filterOptions.sortField as keyof StaffMember] as string).toLowerCase();
      
      if (filterOptions.sortDirection === 'asc') {
        return fieldA.localeCompare(fieldB);
      } else {
        return fieldB.localeCompare(fieldA);
      }
    });
  }
  
  return filtered;
};