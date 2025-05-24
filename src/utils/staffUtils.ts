// src/utils/staffUtils.ts

import { StaffMember, FilterOptions } from '../types/staff';


export const filterStaff = (
  staffList: StaffMember[], // Renamed to avoid conflict if used in a component named 'staff'
  searchTerm: string,
  filterOptions: FilterOptions
): StaffMember[] => {
  if (!staffList) return [];

  let filtered = [...staffList];
  
  // Text search filter (general search across multiple fields)
  if (searchTerm && searchTerm.trim()) {
    const lowerSearchTerm = searchTerm.trim().toLowerCase();
    filtered = filtered.filter(
      (member) =>
        member.name.toLowerCase().includes(lowerSearchTerm) ||
        (member.username ? member.username.toLowerCase().includes(lowerSearchTerm) : false) ||
        member.email.toLowerCase().includes(lowerSearchTerm) ||
        (member.phoneNumber ? member.phoneNumber.includes(lowerSearchTerm) : false) ||
        member.position.toLowerCase().includes(lowerSearchTerm)
    );
  }
  
  // Specific field filters from advanced filter options
  if (filterOptions.nameFilter && filterOptions.nameFilter.trim()) {
    const lowerNameFilter = filterOptions.nameFilter.trim().toLowerCase();
    filtered = filtered.filter(member => 
      member.name.toLowerCase().includes(lowerNameFilter)
    );
  }
  
  if (filterOptions.emailFilter && filterOptions.emailFilter.trim()) {
    const lowerEmailFilter = filterOptions.emailFilter.trim().toLowerCase();
    filtered = filtered.filter(member => 
      member.email.toLowerCase().includes(lowerEmailFilter)
    );
  }
  
  if (filterOptions.phoneFilter && filterOptions.phoneFilter.trim()) {
    const phoneFilterValue = filterOptions.phoneFilter.trim();
    filtered = filtered.filter(member => 
      member.phoneNumber ? member.phoneNumber.includes(phoneFilterValue) : false
    );
  }
  
  if (filterOptions.roleFilter) {
    filtered = filtered.filter(member => member.role === filterOptions.roleFilter);
  }
  
  if (filterOptions.positionFilter) {
    filtered = filtered.filter(member => member.position === filterOptions.positionFilter);
  }
  
  // Sort the filtered data
  if (filterOptions.sortField) {
    const sortable = [...filtered];
    sortable.sort((a, b) => {
      const valA = a[filterOptions.sortField as keyof StaffMember];
      const valB = b[filterOptions.sortField as keyof StaffMember];

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