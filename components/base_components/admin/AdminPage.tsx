import React, { useState, useEffect } from 'react';
import styles from '../../component_styles/StaffFeature.module.css';
import { useAdmins } from '../../../src/hooks/useAdmins';
import { useFilteredAdmins } from '../../../src/hooks/useFilteredAdmins';
import { AdminMember, AdminFormData } from '../../../src/types/admin';
import AdminTable from './AdminTable';
import AdminList from './AdminList';
import AdminFilters from './AdminFilters';
import AdminForm from './AdminForm';
import Pagination from '../../common/PaginationStaffAdmin';
import ConfirmationModal from '../../common/ConfirmationModal';
import { toast } from 'react-toastify';

const ITEMS_PER_PAGE = 9;

const AdminPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAdmins, setCurrentAdmins] = useState<AdminMember[]>([]);
  const [userRole] = useState("super_admin"); // Assuming current user is super_admin
  
  // State for modals
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<AdminMember | undefined>(undefined);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [adminToToggle, setAdminToToggle] = useState<AdminMember | null>(null);
  
  // Get admin data and operations
  const { 
    admins, 
    isLoading, 
    error, 
    addAdmin, 
    updateAdmin, 
    toggleAdminStatus,
    refreshAdmins  // Add this line
  } = useAdmins();
  
  // Get filtering functionality
  const {
    searchTerm,
    setSearchTerm,
    filterOptions,
    updateFilter,
    resetFilters,
    toggleSortDirection,
    filteredAdmins
  } = useFilteredAdmins(admins);
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE));
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterOptions]);
  
  // Update current admins when page or filtered data changes
  useEffect(() => {
    // If current page is out of bounds, adjust it
    let newCurrentPage = currentPage;
    if (newCurrentPage > totalPages && totalPages > 0) {
      newCurrentPage = totalPages;
      setCurrentPage(totalPages);
    }

    const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentAdmins(filteredAdmins.slice(startIndex, endIndex));
  }, [currentPage, filteredAdmins, totalPages]);
  
  // Handle edit admin
  const handleEditClick = (admin: AdminMember) => {
    setAdminToEdit(admin);
    setIsEditAdminOpen(true);
  };
  
  // Handle deactivate admin
  const handleDeactivateClick = (admin: AdminMember) => {
    setAdminToToggle(admin);
    setIsConfirmationOpen(true);
  };
  
  // Handle confirm deactivation
  const handleConfirmToggle = async () => {
    if (adminToToggle) {
      await toggleAdminStatus(adminToToggle.id);
      setIsConfirmationOpen(false);
      setAdminToToggle(null);
    }
  };
  
  // Handle add admin submit
  const handleAddAdminSubmit = async (formData: AdminFormData) => {
    const result = await addAdmin(formData);
    if (result.success) {
      setIsAddAdminOpen(false);
    }
  };
  
  // Handle edit admin submit
  const handleEditAdminSubmit = async (formData: AdminFormData) => {
    if (adminToEdit) {
      try {
        console.log("Submitting edit for admin:", adminToEdit.id);
        console.log("Form data:", formData);
        
        const result = await updateAdmin(adminToEdit.id, formData);
        
        if (result.success) {
          // Close the edit form
          setIsEditAdminOpen(false);
          setAdminToEdit(undefined);
          
          // Explicitly refetch data after successful edit
          const refreshResult = await refreshAdmins({ 
            showLoading: false,  // Don't show global loading state during refresh
            silentError: true    // Don't show error message if refresh fails
          });
          
          if (refreshResult.success) {
            toast.success("Admin updated successfully");
          } else {
            // If refresh fails, show a less critical message
            toast.info("Admin updated, refreshing data...");
            // Try one more time with full loading if needed
            refreshAdmins();
          }
        } else {
          toast.error(result.error || "Failed to update admin");
        }
      } catch (err) {
        console.error("Exception in handleEditAdminSubmit:", err);
        toast.error("An unexpected error occurred");
      }
    }
  };
  
  // Apply filters and close modal
  const handleApplyFilters = () => {
    setCurrentPage(1);
    setIsFilterOpen(false);
  };
  
  if (isLoading) {
    return <div className={styles.loading}>Loading admins...</div>;
  }
  
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
  return (
    <div className={styles.staffFeatureContainer}>
      <div className={styles.staffTopContent}>
        <AdminList
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onFilterClick={() => setIsFilterOpen(true)}
          onAddAdminClick={() => setIsAddAdminOpen(true)}
        />

        {currentAdmins.length > 0 ? (
          <AdminTable 
            adminData={currentAdmins} 
            currentPage={currentPage} 
            role={userRole}
            onEdit={handleEditClick}
            onDeactivate={handleDeactivateClick}
          />
        ) : (
          <p className={styles.noResults}>
            {searchTerm.trim() || Object.values(filterOptions).some(v => v !== '' && v !== 'name' && v !== 'asc')
              ? "No admin members found matching your search."
              : "No admin members to display."}
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modals */}
      <AdminFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filterOptions={filterOptions}
        onFilterChange={(name, value) => {
          // Ensure type safety by only passing valid keys of FilterOptions
          if (typeof name === 'string' && name in filterOptions) {
            updateFilter(name as keyof typeof filterOptions, value);
          }
        }}
        onApplyFilters={handleApplyFilters}
        onResetFilters={resetFilters}
        onToggleSortDirection={toggleSortDirection}
      />
      
      <AdminForm
        isOpen={isAddAdminOpen}
        onClose={() => setIsAddAdminOpen(false)}
        onSubmit={handleAddAdminSubmit}
        title="Add New Admin"
        submitLabel="Add Admin"
      />
      
      <AdminForm
        isOpen={isEditAdminOpen}
        admin={adminToEdit}
        onClose={() => {
          setIsEditAdminOpen(false);
          setAdminToEdit(undefined);
        }}
        onSubmit={handleEditAdminSubmit}
        title="Edit Admin"
        submitLabel="Save Changes"
      />
      
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        title={adminToToggle?.isActive === false ? "Activate Admin" : "Deactivate Admin"}
        message={`Are you sure you want to ${adminToToggle?.isActive === false ? 'activate' : 'deactivate'} <strong>${adminToToggle?.name}</strong>?`}
        subMessage={adminToToggle?.isActive === false 
          ? "This will allow them to access the system again."
          : "This will prevent them from accessing the system until reactivated by a super administrator."}
        confirmLabel={adminToToggle?.isActive === false ? "Activate" : "Deactivate"}
        onConfirm={handleConfirmToggle}
        onCancel={() => {
          setIsConfirmationOpen(false);
          setAdminToToggle(null);
        }}
        isDanger={adminToToggle?.isActive !== false}
      />
    </div>
  );
};

export default AdminPage;