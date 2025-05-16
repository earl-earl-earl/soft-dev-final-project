import { useState, useMemo } from 'react';
import { StaffMember, FilterOptions } from '../../src/types/staff';
import { filterStaff } from '../../src/utils/staffUtils';

interface UseFilteredStaffProps {
  staff: StaffMember[];
  itemsPerPage: number;
}

export function useFilteredStaff({ staff, itemsPerPage }: UseFilteredStaffProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    nameFilter: '',
    emailFilter: '',
    phoneFilter: '',
    roleFilter: '',
    positionFilter: '',
    sortField: 'name',
    sortDirection: 'asc'
  });
  
  // Filter staff based on search term and filter options
  const filteredStaff = useMemo(() => {
    return filterStaff(staff, searchTerm, filterOptions);
  }, [staff, searchTerm, filterOptions]);
  
  // Calculate pagination
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredStaff.length / itemsPerPage));
  }, [filteredStaff, itemsPerPage]);
  
  // Get current page staff
  const currentStaff = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStaff.slice(startIndex, endIndex);
  }, [filteredStaff, currentPage, itemsPerPage]);
  
  // Update a single filter option
  const updateFilter = (name: keyof FilterOptions, value: string | 'asc' | 'desc') => {
    setFilterOptions(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilterOptions({
      nameFilter: '',
      emailFilter: '',
      phoneFilter: '',
      roleFilter: '',
      positionFilter: '',
      sortField: 'name',
      sortDirection: 'asc'
    });
    setCurrentPage(1);
  };
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    updateFilter('sortDirection', filterOptions.sortDirection === 'asc' ? 'desc' : 'asc');
  };
  
  return {
    searchTerm,
    setSearchTerm,
    filterOptions,
    updateFilter,
    resetFilters,
    toggleSortDirection,
    filteredStaff,
    currentStaff,
    currentPage,
    setCurrentPage,
    totalPages
  };
}