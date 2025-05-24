// src/hooks/useFilteredAdmins.ts
import { useState, useMemo, useEffect } from 'react';
import { AdminMember, FilterOptions } from '../types/admin';
import { filterAdmins } from '../utils/adminUtils';

interface UseFilteredAdminsProps {
  admins: AdminMember[]; // All admin members from useAdmins
  itemsPerPage?: number;
}

interface UseFilteredAdminsReturn {
  currentAdmins: AdminMember[];
  filteredAdminsCount: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  
  filterOptions: FilterOptions;
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptions>>;
  
  resetFilters: () => void;
  toggleSortDirection: (field: keyof AdminMember) => void;
}

const DEFAULT_ITEMS_PER_PAGE = 9;

export function useFilteredAdmins({ 
  admins, 
  itemsPerPage = DEFAULT_ITEMS_PER_PAGE 
}: UseFilteredAdminsProps): UseFilteredAdminsReturn {
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    nameFilter: "",
    usernameFilter: "", // from FilterOptions
    emailFilter: "",
    phoneFilter: "",
    roleFilter: "",     // Default to 'all' (empty string for no filter)
    positionFilter: "", // Added to match FilterOptions type
    accessLevelFilter: "",
    isActiveFilter: "all", // Default to show all active/inactive
    sortField: "name",  // Default sort field
    sortDirection: "asc"
  });

  const [currentPage, setCurrentPage] = useState(1);

  // 1. Apply all primary filters (search, advanced options)
  const trulyFilteredAdmins = useMemo(() => {
    // console.log("useFilteredAdmins: Filtering admins. Search:", searchTerm, "Options:", filterOptions);
    // filterAdmins utility now takes (admins, searchTerm, filterOptions)
    // isActiveFilter in filterOptions handles active/inactive status
    return filterAdmins(admins || [], searchTerm, filterOptions);
  }, [admins, searchTerm, filterOptions]);

  // 2. Calculate pagination based on the fully filtered list
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(trulyFilteredAdmins.length / itemsPerPage));
  }, [trulyFilteredAdmins.length, itemsPerPage]);

  // 3. Get the admins for the current page
  const currentAdmins = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return trulyFilteredAdmins.slice(startIndex, startIndex + itemsPerPage);
  }, [trulyFilteredAdmins, currentPage, itemsPerPage]);

  // Reset to page 1 when filters or the base list change significantly
  useEffect(() => {
    // If current page becomes invalid due to filtering, reset to 1
    if (currentPage > totalPages) {
        setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Effect to reset page to 1 if filters change, but not if only pagination changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterOptions, admins]);


  const resetFilters = () => {
    setFilterOptions({
      nameFilter: "",
      usernameFilter: "",
      emailFilter: "",
      phoneFilter: "",
      roleFilter: "",
      positionFilter: "",
      accessLevelFilter: "",
      isActiveFilter: "all",
      sortField: "name", // Default sort
      sortDirection: "asc"
    });
    setCurrentPage(1); // Go back to first page
  };
  
  const toggleSortDirection = (field: keyof AdminMember) => {
    setFilterOptions(prev => ({
      ...prev,
      sortField: field, // Set the new field to sort by
      sortDirection: prev.sortField === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to page 1 on sort change
  };
  
  return {
    currentAdmins, // Paginated list
    filteredAdminsCount: trulyFilteredAdmins.length,
    totalPages,
    currentPage,
    setCurrentPage,

    
    searchTerm,
    setSearchTerm,
    
    filterOptions,
    setFilterOptions,
    
    resetFilters,
    toggleSortDirection,
    // isSingleRow can be calculated in AdminPage based on currentAdmins.length
  };
}