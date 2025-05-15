import React, { useState, useEffect, useMemo } from "react";
import StaffTable from "./StaffTable";
import styles from "../component_styles/StaffFeature.module.css";

interface StaffMember {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  position: string;
}

const positions = [
  "Staff Manager",
  "Technical Staff",
  "Senior Staff",
  "Junior Staff",
  "Temporary Staff",
  "Trainee"
];

const ALL_STAFF_MEMBERS: StaffMember[] = Array.from({ length: 3 }, (_, i) => {
  const positionIndex = i % positions.length;
  
  return {
    id: `id-${i + 1}`,
    username: `user${i + 1}`,
    name: `Name ${i + 1}`,
    email: `user${i + 1}@example.com`,
    phoneNumber: "0923 321 7654",
    role: "Staff",                     // All have the same role
    position: positions[positionIndex] // Varied positions
  };
});

const ITEMS_PER_PAGE = 9;

const StaffFeature: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentStaff, setCurrentStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  // Add these new state variables under your existing states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "Staff",
    position: "",
  });
  // Add password visibility state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const filteredStaff = useMemo(() => {
    let filtered = ALL_STAFF_MEMBERS;
    
    // Text search filter (already exists)
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (staff) =>
          staff.name.toLowerCase().includes(lowerSearchTerm) ||
          staff.username.toLowerCase().includes(lowerSearchTerm) ||
          staff.email.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Name filter
    if (nameFilter.trim()) {
      const lowerNameFilter = nameFilter.toLowerCase();
      filtered = filtered.filter(staff => 
        staff.name.toLowerCase().includes(lowerNameFilter)
      );
    }
    
    // Email filter
    if (emailFilter.trim()) {
      const lowerEmailFilter = emailFilter.toLowerCase();
      filtered = filtered.filter(staff => 
        staff.email.toLowerCase().includes(lowerEmailFilter)
      );
    }
    
    // Phone filter
    if (phoneFilter.trim()) {
      filtered = filtered.filter(staff => 
        staff.phoneNumber.includes(phoneFilter)
      );
    }
    
    // Role filter
    if (roleFilter) {
      filtered = filtered.filter(staff => staff.role === roleFilter);
    }
    
    // Position filter (already exists)
    if (positionFilter) {
      filtered = filtered.filter(staff => staff.position === positionFilter);
    }
    
    // Sort the filtered data
    if (sortField) {
      filtered.sort((a, b) => {
        const fieldA = (a[sortField as keyof StaffMember] as string).toLowerCase();
        const fieldB = (b[sortField as keyof StaffMember] as string).toLowerCase();
        
        if (sortDirection === 'asc') {
          return fieldA.localeCompare(fieldB);
        } else {
          return fieldB.localeCompare(fieldA);
        }
      });
    }
    
    return filtered;
  }, [searchTerm, nameFilter, emailFilter, phoneFilter, roleFilter, positionFilter, sortField, sortDirection]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredStaff.length / ITEMS_PER_PAGE));
  }, [filteredStaff]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm])

  useEffect(() => {
    let newCurrentPage = currentPage;

    if (currentPage > totalPages) {
      newCurrentPage = totalPages;
      setCurrentPage(totalPages);
      return;
    }

    const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentStaff(filteredStaff.slice(startIndex, endIndex));
  }, [currentPage, filteredStaff, totalPages]);

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (totalPages > 0 && endPage > totalPages) {
      endPage = totalPages;
    }

    if (startPage < 1 && totalPages > 0) {
      startPage = 1;
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  // Add these functions before the return statement

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleAddStaffToggle = () => {
    setIsAddStaffOpen(!isAddStaffOpen);
  };

  const handleNewStaffChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally add this staff to your API or state
    console.log("New staff to be added:", newStaff);
    
    // Reset form and close
    setNewStaff({
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      role: "Staff",
      position: "",
    });
    setIsAddStaffOpen(false);
  };

  const applyFilter = () => {
    setCurrentPage(1); // Reset to first page when filter changes
    setIsFilterOpen(false);
  };

  const clearFilter = () => {
    setNameFilter("");
    setEmailFilter("");
    setPhoneFilter("");
    setRoleFilter("");
    setPositionFilter("");
    setSortField("name");
    setSortDirection("asc");
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortField(e.target.value);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className={styles.staffFeatureContainer}>
      <div className={styles.staffTopContent}>
        <div className={styles.controlsHeader}>
          <div className={styles.searchBar}>
            <i className={`fa-regular fa-magnifying-glass ${styles.searchIcon}`}></i>
            <input
              type="text"
              placeholder="Search staff by username"
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* MODIFIED BUTTON BELOW */}
            <button className={styles.filterButton} title="Filter" onClick={handleFilterToggle}>
              <i className="fa-regular fa-filter"></i>
              <span className={styles.tooltipText}>Filter</span>
            </button>
          </div>
          <button className={styles.addButton} onClick={handleAddStaffToggle}>
            <i className="fa-regular fa-plus"></i> Add New Staff
          </button>
        </div>

        {currentStaff.length > 0 ? (
          <StaffTable staffData={currentStaff} currentPage={currentPage} role={""} />
        ) : (
          <p className={styles.noResults}>
            {searchTerm.trim()
              ? "No staff members found matching your search."
              : "No staff members to display."}
          </p>
        )}
      </div>

      {totalPages > 1 &&
        filteredStaff.length > 0 && (
          <nav className={styles.pagination}>
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={styles.pageButton}
            >
              <i className="fa-regular fa-chevron-left"></i> Previous
            </button>
            <div className={styles.pageNumbers}>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`${styles.pageNumberButton} ${
                    currentPage === page ? styles.active : ""
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className={styles.pageButton}
            >
              Next <i className="fa-regular fa-chevron-right"></i>
            </button>
          </nav>
        )}

      {/* Filter Overlay */}
      {isFilterOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Filter & Sort Staff</h3>
              <button className={styles.closeButton} onClick={handleFilterToggle}>
                <i className="fa-regular fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <h4 className={styles.formSectionTitle}>Filters</h4>
              <div className={styles.formGroup}>
                <label htmlFor="nameFilter">Name</label>
                <input
                  type="text"
                  id="nameFilter"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className={styles.formControl}
                  placeholder="Filter by name"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="emailFilter">Email</label>
                <input
                  type="text"
                  id="emailFilter"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className={styles.formControl}
                  placeholder="Filter by email"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="phoneFilter">Phone Number</label>
                <input
                  type="text"
                  id="phoneFilter"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  className={styles.formControl}
                  placeholder="Filter by phone number"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="roleFilter">Role</label>
                <select
                  id="roleFilter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={styles.formControl}
                >
                  <option value="">All Roles</option>
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="positionFilter">Position</label>
                <select
                  id="positionFilter"
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className={styles.formControl}
                >
                  <option value="">All Positions</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
              
              <h4 className={styles.formSectionTitle}>Sorting</h4>
              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <label htmlFor="sortField">Sort By</label>
                  <select
                    id="sortField"
                    value={sortField}
                    onChange={handleSortChange}
                    className={styles.formControl}
                  >
                    <option value="name">Name</option>
                    <option value="username">Username</option>
                    <option value="email">Email</option>
                    <option value="role">Role</option>
                    <option value="position">Position</option>
                  </select>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label htmlFor="sortDirection">Direction</label>
                  <div className={styles.sortDirectionToggle}>
                    <button 
                      type="button"
                      onClick={toggleSortDirection}
                      className={styles.sortDirectionButton}
                    >
                      {sortDirection === 'asc' ? (
                        <><i className="fa-regular fa-arrow-up-a-z"></i> Ascending</>
                      ) : (
                        <><i className="fa-regular fa-arrow-down-z-a"></i> Descending</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.secondaryButton} onClick={clearFilter}>
                Clear All
              </button>
              <button className={styles.primaryButton} onClick={applyFilter}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Staff Form */}
      {isAddStaffOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Add New Staff</h3>
              <button className={styles.closeButton} onClick={handleAddStaffToggle}>
                <i className="fa-regular fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddStaff}>
              <div className={styles.modalBody}>
                <h4 className={styles.formSectionTitle}>User Details</h4>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newStaff.name}
                    onChange={handleNewStaffChange}
                    className={styles.formControl}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newStaff.email}
                    onChange={handleNewStaffChange}
                    className={styles.formControl}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={newStaff.phoneNumber}
                    onChange={handleNewStaffChange}
                    className={styles.formControl}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="password">Password</label>
                  <div className={styles.passwordInputContainer}>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="password"
                      name="password"
                      value={newStaff.password}
                      onChange={handleNewStaffChange}
                      className={styles.formControl}
                      required
                    />
                    <button 
                      type="button" 
                      className={styles.eyeIcon} 
                      onClick={togglePasswordVisibility}
                    >
                      <i className={passwordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                    </button>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className={styles.passwordInputContainer}>
                    <input
                      type={confirmPasswordVisible ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={newStaff.confirmPassword}
                      onChange={handleNewStaffChange}
                      className={styles.formControl}
                      required
                    />
                    <button 
                      type="button" 
                      className={styles.eyeIcon} 
                      onClick={toggleConfirmPasswordVisibility}
                    >
                      <i className={confirmPasswordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                    </button>
                  </div>
                </div>
                
                <h4 className={styles.formSectionTitle}>Role & Position</h4>
                <div className={styles.formGroup}>
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={newStaff.role}
                    onChange={handleNewStaffChange}
                    className={styles.formControl}
                    required
                  >
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="position">Position</label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={newStaff.position}
                    onChange={handleNewStaffChange}
                    className={styles.formControl}
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryButton} onClick={handleAddStaffToggle}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton}>
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffFeature;