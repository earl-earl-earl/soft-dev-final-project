import React, { useState, useEffect, useRef } from 'react';
import styles from '../../component_styles/StaffFeature.module.css';
import { StaffMember, StaffFormData } from '../../../src/types/staff';
import { useStaff } from '../../../src/hooks/useStaff';
import { useFilteredStaff } from '../../../src/hooks/useFilteredStaff';
import { useSessionContext } from '@/contexts/SessionContext';
import { toast } from 'react-toastify';

// Import components
import StaffList from './StaffList';
import StaffTable from './StaffTable';
import StaffFilters from './StaffFilters';
import StaffForm from './StaffForm';
import Pagination from '../../common/Pagination';
import ConfirmationModal from '../../common/ConfirmationModalStaff';

const ITEMS_PER_PAGE = 9;

const StaffPage: React.FC = () => {
  const { role } = useSessionContext();
  
  // Get staff data and operations
  const { staff, isLoading, error, addStaff, updateStaff, toggleStaffStatus, refreshStaff } = useStaff();
  
  // Get filtering and pagination
  const {
    searchTerm,
    setSearchTerm,
    filterOptions,
    updateFilter,
    resetFilters,
    toggleSortDirection,
    currentStaff,
    currentPage,
    setCurrentPage,
    totalPages
  } = useFilteredStaff({ 
    staff, 
    itemsPerPage: ITEMS_PER_PAGE 
  });
  
  // UI state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [staffToToggle, setStaffToToggle] = useState<StaffMember | null>(null);
  
  // Animation states for loading effect
  const [animate, setAnimate] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const loadingFinishedRef = useRef(false);
  
  // Handle animation after loading finishes
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
  
  // Handle add staff
  const handleAddStaff = async (formData: StaffFormData) => {
    const result = await addStaff(formData);
    if (result.success) {
      setIsAddStaffOpen(false);
    } else {
      // Show error
      alert(result.error || 'Failed to add staff');
    }
  };
  
  // Handle edit staff
  const handleEditStaff = async (formData: StaffFormData) => {
    if (!selectedStaff) return;
    
    // Set loading state if needed
    // setIsLoading(true);
    
    const result = await updateStaff(selectedStaff.id, formData);
    if (result.success) {
      // Close the edit form
      setIsEditStaffOpen(false);
      setSelectedStaff(null);
      
      // Explicitly refetch data after successful edit
      const refreshResult = await refreshStaff({ 
        showLoading: false, // Don't show global loading state during refresh
        silentError: true   // Don't show error message if refresh fails
      });
      
      if (refreshResult.success) {
        toast.success("Staff updated successfully");
      } else {
        // If refresh fails, show a less critical message
        toast.info("Staff updated, refreshing data...");
        // Try one more time with full loading if needed
        refreshStaff();
      }
    } else {
      // Show error
      alert(result.error || 'Failed to update staff');
    }
  };
  
  // Handle toggle staff status
  const handleToggleStatus = async () => {
    if (!staffToToggle) return;
    
    const result = await toggleStaffStatus(staffToToggle.id);
    if (result.success) {
      setIsConfirmationOpen(false);
      setStaffToToggle(null);
    } else {
      // Show error
      alert(result.error || 'Failed to toggle staff status');
    }
  };
  
  // Open edit form
  const handleEditClick = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setIsEditStaffOpen(true);
  };
  
  // Open deactivate confirmation
  const handleToggleStatusClick = (staff: StaffMember) => {
    setStaffToToggle(staff);
    setIsConfirmationOpen(true);
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    setIsFilterOpen(false);
  };

  // The loading screen
  if (!showContent) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingAnimation}>
          <div className={styles.spinnerContainer}>
            <i className="fa-solid fa-user-tie fa-beat-fade"></i>
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
              <div className={styles.loadingTableRow}></div>
            </div>
          </div>
        </div>
        <h3 className={styles.loadingTitle}>Loading Staff</h3>
        <p className={styles.loadingText}>Preparing staff information...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fa-regular fa-exclamation-circle"></i>
        <h3>Error Loading Staff</h3>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => refreshStaff()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${styles.staffFeatureContainer} ${animate ? styles.fadeIn : ""}`}>
      <div className={`${styles.staffTopContent} ${animate ? styles.animateFirst : ""}`}>
        <StaffList
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onFilterClick={() => setIsFilterOpen(true)}
          onAddStaffClick={() => setIsAddStaffOpen(true)}
        />

        <div className={`${animate ? styles.animateSecond : ""}`}>
          {currentStaff.length > 0 ? (
            <StaffTable 
              staffData={currentStaff} 
              currentPage={currentPage} 
              userRole={role || ''}
              onEdit={handleEditClick}
              onToggleStatus={handleToggleStatusClick}
              animate={animate}
            />
          ) : (
            <p className={styles.noResults}>
              {searchTerm.trim() || Object.values(filterOptions).some(v => v !== '' && v !== 'name' && v !== 'asc')
                ? "No staff members found matching your search."
                : "No staff members to display."}
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
      <StaffFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filterOptions={filterOptions}
        onFilterChange={updateFilter}
        onApplyFilters={handleApplyFilters}
        onResetFilters={resetFilters}
        onToggleSortDirection={toggleSortDirection}
      />
      
      <StaffForm
        isOpen={isAddStaffOpen}
        initialData={{}}
        isEditing={false}
        onClose={() => setIsAddStaffOpen(false)}
        onSubmit={handleAddStaff}
      />
      
      {selectedStaff && (
        <StaffForm
          isOpen={isEditStaffOpen}
          initialData={{
            name: selectedStaff.name,
            username: selectedStaff.username,
            phoneNumber: selectedStaff.phoneNumber,
            role: selectedStaff.role,
            position: selectedStaff.position,
            password: '',
            confirmPassword: ''
          }}
          isEditing={true}
          onClose={() => {
            setIsEditStaffOpen(false);
            setSelectedStaff(null);
          }}
          onSubmit={handleEditStaff}
        />
      )}
      
      <ConfirmationModal
        isOpen={isConfirmationOpen}
        title={staffToToggle?.isActive === false ? "Activate Staff" : "Deactivate Staff"}
        message={
          <>
            Are you sure you want to {staffToToggle?.isActive === false ? 'activate' : 'deactivate'} <strong>{staffToToggle?.name}</strong>?
          </>
        }
        subMessage={
          staffToToggle?.isActive === false
            ? "This will allow them to access the system again."
            : "This will prevent them from accessing the system until reactivated by an administrator."
        }
        confirmLabel={staffToToggle?.isActive === false ? "Activate" : "Deactivate"}
        onConfirm={handleToggleStatus}
        onCancel={() => {
          setIsConfirmationOpen(false);
          setStaffToToggle(null);
        }}
        isDanger={staffToToggle?.isActive !== false}
      />
    </div>
  );
};

export default StaffPage;