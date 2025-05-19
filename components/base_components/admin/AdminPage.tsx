import React, { useState, useEffect, useRef } from 'react';
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
import { useSessionContext } from '@/contexts/SessionContext';

const ITEMS_PER_PAGE = 9;

const AdminPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAdmins, setCurrentAdmins] = useState<AdminMember[]>([]);
  const { role } = useSessionContext(); // Get role from session context
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for modals
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<AdminMember | undefined>(undefined);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [adminToToggle, setAdminToToggle] = useState<AdminMember | null>(null);
  
  // Add these near your other state declarations
  const [animate, setAnimate] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const loadingFinishedRef = useRef(false);
  
  // Get admin data and operations
  const { 
    admins, 
    isLoading, 
    error, 
    addAdmin, 
    updateAdmin, 
    toggleAdminStatus,
    refreshAdmins
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
    const adjustedPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
    
    if (adjustedPage !== currentPage) {
      setCurrentPage(adjustedPage);
    }

    const startIndex = (adjustedPage - 1) * ITEMS_PER_PAGE;
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
    if (!adminToToggle) return;
    
    setIsSubmitting(true);
    try {
      const result = await toggleAdminStatus(adminToToggle.id);
      if (result.success) {
        toast.success(`Admin ${adminToToggle.isActive ? 'deactivated' : 'activated'} successfully`);
      } else {
        toast.error(result.error || 'Failed to update admin status');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsConfirmationOpen(false);
      setAdminToToggle(null);
    }
  };
  
  // Handle add admin submit
  const handleAddAdminSubmit = async (formData: AdminFormData) => {
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phoneNumber.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await addAdmin(formData);
      if (result.success) {
        toast.success('Admin added successfully');
        setIsAddAdminOpen(false);
        refreshAdmins();
      } else {
        toast.error(result.error || 'Failed to add admin');
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle edit admin submit
  const handleEditAdminSubmit = async (formData: AdminFormData) => {
    if (!adminToEdit) return;
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phoneNumber.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await updateAdmin(adminToEdit.id, formData);
      
      if (result.success) {
        // Close the edit form
        setIsEditAdminOpen(false);
        setAdminToEdit(undefined);
        
        toast.success("Admin updated successfully");
        refreshAdmins({ showLoading: false });
      } else {
        toast.error(result.error || "Failed to update admin");
      }
    } catch (err) {
      console.error("Exception in handleEditAdminSubmit:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Apply filters and close modal
  const handleApplyFilters = () => {
    setCurrentPage(1);
    setIsFilterOpen(false);
  };
  
  // Add this effect to handle loading transition
  useEffect(() => {
    if (!isLoading && !loadingFinishedRef.current) {
      loadingFinishedRef.current = true;
      
      // Small delay to ensure smooth transition from loading to content
      const timer = setTimeout(() => {
        setShowContent(true);
        
        // Then trigger animations with a slight delay
        setTimeout(() => {
          setAnimate(true);
        }, 100);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
  if (!showContent) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingAnimation}>
          <div className={styles.spinnerContainer}>
            <i className="fa-solid fa-user-cog fa-beat-fade"></i>
          </div>
          <div className={styles.loadingCards}>
            <div className={`${styles.loadingCard} ${styles.loadingCard1}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard2}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard3}`}></div>
          </div>
          <div className={styles.loadingTable}>
            <div className={styles.loadingTableHeader}></div>
            <div className={styles.loadingTableRows}>
              <div className={styles.loadingTableRow}></div>
              <div className={styles.loadingTableRow}></div>
              <div className={styles.loadingTableRow}></div>
            </div>
          </div>
        </div>
        <h3 className={styles.loadingTitle}>Loading Admins</h3>
        <p className={styles.loadingText}>Preparing administrator data...</p>
      </div>
    );
  }
  
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
  const isSuperAdmin = role === "super_admin";
  
  if (!isSuperAdmin) {
    return <div className={styles.error}>You do not have permission to access this page.</div>;
  }
  
  return (
    <div className={`${styles.staffFeatureContainer} ${animate ? styles.fadeIn : ""}`}>
      <div className={`${styles.staffTopContent} ${animate ? styles.animateFirst : ""}`}>
        <AdminList
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onFilterClick={() => setIsFilterOpen(true)}
          onAddAdminClick={() => setIsAddAdminOpen(true)}
        />

        <div className={`${animate ? styles.animateSecond : ""}`}>
          {currentAdmins.length > 0 ? (
            <AdminTable 
              adminData={currentAdmins} 
              currentPage={currentPage} 
              role={role || ''}
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
      </div>

      {totalPages > 1 && (
        <div className={`${animate ? styles.animateThird : ""}`}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
      
      {/* Modals */}
      <AdminFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filterOptions={filterOptions}
        onFilterChange={updateFilter}
        onApplyFilters={handleApplyFilters}
        onResetFilters={resetFilters}
        onToggleSortDirection={toggleSortDirection}
      />
      
      <AdminForm
        isOpen={isAddAdminOpen}
        onClose={() => setIsAddAdminOpen(false)}
        onSubmit={handleAddAdminSubmit}
        title="Add New Admin"
        submitLabel={isSubmitting ? "Adding..." : "Add Admin"}
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
        submitLabel={isSubmitting ? "Saving..." : "Save Changes"}
      />
      
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        title={adminToToggle?.isActive === false ? "Activate Admin" : "Deactivate Admin"}
        message={
          <>
            Are you sure you want to {adminToToggle?.isActive === false ? 'activate' : 'deactivate'} <strong>{adminToToggle?.name}</strong>?
          </>
        }
        subMessage={adminToToggle?.isActive === false 
          ? "This will allow them to access the system again."
          : "This will prevent them from accessing the system until reactivated by a super administrator."}
        confirmLabel={isSubmitting ? "Processing..." : (adminToToggle?.isActive === false ? "Activate" : "Deactivate")}
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