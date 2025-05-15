import React, { useState, useEffect, useMemo } from "react";
import AdminTable from "./AdminTable";
import styles from "../component_styles/StaffFeature.module.css";

interface AdminMember {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  accessLevel: string;
}

const accessLevels = [
  "System Administrator",
  "Content Manager",
  "User Manager", 
  "Analytics Manager",
  "Support Administrator"
];

const ALL_ADMIN_MEMBERS: AdminMember[] = [
  {
    id: "admin-1",
    username: "admin_super",
    name: "John Smith",
    email: "jsmith@example.com",
    phoneNumber: "0923 456 7890",
    role: "super_admin",
    accessLevel: "System Administrator"
  },
  {
    id: "admin-2",
    username: "admin_content",
    name: "Maria Garcia",
    email: "mgarcia@example.com",
    phoneNumber: "0923 789 1234",
    role: "admin",
    accessLevel: "Content Manager"
  },
  {
    id: "admin-3", 
    username: "admin_user",
    name: "Alex Johnson",
    email: "ajohnson@example.com",
    phoneNumber: "0923 321 6547",
    role: "admin",
    accessLevel: "User Manager"
  }
];

const ITEMS_PER_PAGE = 9;

const AdminFeature: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAdmins, setCurrentAdmins] = useState<AdminMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole] = useState("super_admin"); // Assuming current user is super_admin
  
  // Add these new state variables
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [accessLevelFilter, setAccessLevelFilter] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    accessLevel: "",
  });
  
  // Add password visibility state
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const filteredAdmins = useMemo(() => {
    let filtered = ALL_ADMIN_MEMBERS;
    
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
    
    // Name filter
    if (nameFilter.trim()) {
      const lowerNameFilter = nameFilter.toLowerCase();
      filtered = filtered.filter(admin => 
        admin.name.toLowerCase().includes(lowerNameFilter)
      );
    }
    
    // Email filter
    if (emailFilter.trim()) {
      const lowerEmailFilter = emailFilter.toLowerCase();
      filtered = filtered.filter(admin => 
        admin.email.toLowerCase().includes(lowerEmailFilter)
      );
    }
    
    // Phone filter
    if (phoneFilter.trim()) {
      filtered = filtered.filter(admin => 
        admin.phoneNumber.includes(phoneFilter)
      );
    }
    
    // Role filter
    if (roleFilter) {
      filtered = filtered.filter(admin => admin.role === roleFilter);
    }
    
    // Access Level filter
    if (accessLevelFilter) {
      filtered = filtered.filter(admin => admin.accessLevel === accessLevelFilter);
    }
    
    // Sort the filtered data
    if (sortField) {
      filtered.sort((a, b) => {
        const fieldA = (a[sortField as keyof AdminMember] as string).toLowerCase();
        const fieldB = (b[sortField as keyof AdminMember] as string).toLowerCase();
        
        if (sortDirection === 'asc') {
          return fieldA.localeCompare(fieldB);
        } else {
          return fieldB.localeCompare(fieldA);
        }
      });
    }
    
    return filtered;
  }, [searchTerm, nameFilter, emailFilter, phoneFilter, roleFilter, accessLevelFilter, sortField, sortDirection]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE));
  }, [filteredAdmins]);

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
    setCurrentAdmins(filteredAdmins.slice(startIndex, endIndex));
  }, [currentPage, filteredAdmins, totalPages]);

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

  // Add these functions for the filter and add functionality
  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  const handleAddAdminToggle = () => {
    setIsAddAdminOpen(!isAddAdminOpen);
  };

  const handleNewAdminChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAdmin(prev => ({
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

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally add this admin to your API or state
    console.log("New admin to be added:", newAdmin);
    
    // Reset form and close
    setNewAdmin({
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      role: "admin",
      accessLevel: "",
    });
    setIsAddAdminOpen(false);
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
    setAccessLevelFilter("");
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
              placeholder="Search admin by username or name"
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className={styles.filterButton} title="Filter" onClick={handleFilterToggle}>
              <i className="fa-regular fa-filter"></i>
              <span className={styles.tooltipText}>Filter</span>
            </button>
          </div>
          <button className={styles.addButton} onClick={handleAddAdminToggle}>
            <i className="fa-regular fa-plus"></i> Add New Admin
          </button>
        </div>

        {currentAdmins.length > 0 ? (
          <AdminTable adminData={currentAdmins} currentPage={currentPage} role={userRole} />
        ) : (
          <p className={styles.noResults}>
            {searchTerm.trim()
              ? "No admin members found matching your search."
              : "No admin members to display."}
          </p>
        )}
      </div>

      {totalPages > 1 &&
        filteredAdmins.length > 0 && (
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
              <h3>Filter & Sort Admins</h3>
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
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="accessLevelFilter">Access Level</label>
                <select
                  id="accessLevelFilter"
                  value={accessLevelFilter}
                  onChange={(e) => setAccessLevelFilter(e.target.value)}
                  className={styles.formControl}
                >
                  <option value="">All Access Levels</option>
                  {accessLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
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
                    <option value="accessLevel">Access Level</option>
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

      {/* Add New Admin Form */}
      {isAddAdminOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Add New Admin</h3>
              <button className={styles.closeButton} onClick={handleAddAdminToggle}>
                <i className="fa-regular fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddAdmin}>
              <div className={styles.modalBody}>
                <h4 className={styles.formSectionTitle}>User Details</h4>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newAdmin.name}
                    onChange={handleNewAdminChange}
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
                    value={newAdmin.email}
                    onChange={handleNewAdminChange}
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
                    value={newAdmin.phoneNumber}
                    onChange={handleNewAdminChange}
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
                      value={newAdmin.password}
                      onChange={handleNewAdminChange}
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
                      value={newAdmin.confirmPassword}
                      onChange={handleNewAdminChange}
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
                
                <h4 className={styles.formSectionTitle}>Role & Access</h4>
                <div className={styles.formGroup}>
                  <label htmlFor="role">Role</label>
                  <select
                    id="role"
                    name="role"
                    value={newAdmin.role}
                    onChange={handleNewAdminChange}
                    className={styles.formControl}
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="accessLevel">Access Level</label>
                  <select
                    id="accessLevel"
                    name="accessLevel"
                    value={newAdmin.accessLevel}
                    onChange={handleNewAdminChange}
                    className={styles.formControl}
                    required
                  >
                    <option value="">Select Access Level</option>
                    {accessLevels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryButton} onClick={handleAddAdminToggle}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton}>
                  Add Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeature;