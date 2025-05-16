import { useState, useMemo } from 'react';
import { AdminMember, FilterOptions } from '../types/admin';
import { filterAdmins } from '../utils/adminUtils';

export function useFilteredAdmins(admins: AdminMember[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    nameFilter: "",
    emailFilter: "",
    phoneFilter: "",
    roleFilter: "",
    accessLevelFilter: "",
    sortField: "name",
    sortDirection: "asc"
  });
  
  const filteredAdmins = useMemo(() => {
    return filterAdmins(admins, searchTerm, filterOptions);
  }, [admins, searchTerm, filterOptions]);
  
  const updateFilter = (filterName: keyof FilterOptions, value: string | 'asc' | 'desc') => {
    setFilterOptions(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  const resetFilters = () => {
    setFilterOptions({
      nameFilter: "",
      emailFilter: "",
      phoneFilter: "",
      roleFilter: "",
      accessLevelFilter: "",
      sortField: "name",
      sortDirection: "asc"
    });
  };
  
  const toggleSortDirection = () => {
    setFilterOptions(prev => ({
      ...prev,
      sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  return {
    searchTerm,
    setSearchTerm,
    filterOptions,
    updateFilter,
    resetFilters,
    toggleSortDirection,
    filteredAdmins
  };
}