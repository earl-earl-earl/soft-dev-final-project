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

const ALL_STAFF_MEMBERS: StaffMember[] = Array.from({ length: 28 }, (_, i) => {
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

  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) {
      return ALL_STAFF_MEMBERS;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return ALL_STAFF_MEMBERS.filter(
      (staff) =>
        staff.name.toLowerCase().includes(lowerSearchTerm) ||
        staff.username.toLowerCase().includes(lowerSearchTerm) ||
        staff.email.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm]);

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
            <button className={styles.filterButton} title="Filter">
              <i className="fa-regular fa-filter"></i>
              <span className={styles.tooltipText}>Filter</span>
            </button>
          </div>
          <button className={styles.addButton}>
            <i className="fa-regular fa-plus"></i> Add New Staff
          </button>
        </div>

        {currentStaff.length > 0 ? (
          <StaffTable staffData={currentStaff} currentPage={currentPage} />
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
    </div>
  );
};

export default StaffFeature;