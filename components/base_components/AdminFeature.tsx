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

const ALL_ADMIN_MEMBERS: AdminMember[] = Array.from({ length: 18 }, (_, i) => {
  const accessIndex = i % accessLevels.length;
  
  return {
    id: `admin-${i + 1}`,
    username: `admin${i + 1}`,
    name: `Admin ${i + 1}`,
    email: `admin${i + 1}@example.com`,
    phoneNumber: "0923 456 7890",
    role: i < 3 ? "super_admin" : "admin",  // First three are super_admin
    accessLevel: accessLevels[accessIndex]  // Varied access levels
  };
});

const ITEMS_PER_PAGE = 9;

const AdminFeature: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentAdmins, setCurrentAdmins] = useState<AdminMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole] = useState("super_admin"); // Assuming current user is super_admin

  const filteredAdmins = useMemo(() => {
    if (!searchTerm.trim()) {
      return ALL_ADMIN_MEMBERS;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return ALL_ADMIN_MEMBERS.filter(
      (admin) =>
        admin.name.toLowerCase().includes(lowerSearchTerm) ||
        admin.username.toLowerCase().includes(lowerSearchTerm) ||
        admin.email.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm]);

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
            <button className={styles.filterButton} title="Filter">
              <i className="fa-regular fa-filter"></i>
              <span className={styles.tooltipText}>Filter</span>
            </button>
          </div>
          <button className={styles.addButton}>
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
    </div>
  );
};

export default AdminFeature;