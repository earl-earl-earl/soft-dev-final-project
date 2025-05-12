// components/StaffFeature.tsx
import React, { useState, useEffect, useMemo } from "react"; // Import useMemo
import StaffTable from "./StaffTable";
import styles from "./StaffFeature.module.css";

interface StaffMember {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  position: string;
}

const ALL_STAFF_MEMBERS: StaffMember[] = Array.from({ length: 28 }, (_, i) => ({
  id: `id-${i + 1}`,
  username: `user${i + 1}`,
  name: `Name ${i + 1}`,
  email: `user${i + 1}@example.com`,
  phoneNumber: "0923 321 7654",
  position: "Staff",
}));

const ITEMS_PER_PAGE = 10;

const StaffFeature: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentStaff, setCurrentStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Memoize filteredStaff: it only recalculates if ALL_STAFF_MEMBERS or searchTerm changes.
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
  }, [searchTerm]); // Assuming ALL_STAFF_MEMBERS is stable (defined outside component or fetched once)

  // Memoize totalPages: it only recalculates if filteredStaff changes.
  const totalPages = useMemo(() => {
    // Ensure totalPages is at least 1, even if filteredStaff is empty,
    // to prevent issues with currentPage being 0 or negative.
    return Math.max(1, Math.ceil(filteredStaff.length / ITEMS_PER_PAGE));
  }, [filteredStaff]);

  // Effect 1: Reset current page to 1 when the search term changes.
  // This ensures that after a search, the user always starts from the first page of results.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]); // Only depends on searchTerm

  // Effect 2: Update the displayed staff list and adjust currentPage if it becomes out of bounds.
  // This runs when currentPage changes (user pagination) or when filteredStaff/totalPages change (due to search).
  useEffect(() => {
    let newCurrentPage = currentPage;

    // If the current page is now greater than the total available pages (e.g., after a search reduces results),
    // adjust currentPage to the last valid page.
    if (currentPage > totalPages) {
      newCurrentPage = totalPages;
      setCurrentPage(totalPages); // This will cause this effect to run again with the corrected currentPage
      return; // Exit early to avoid slicing with an invalid currentPage before the state update
    }

    const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentStaff(filteredStaff.slice(startIndex, endIndex));
  }, [currentPage, filteredStaff, totalPages]); // Dependencies are now stable unless their underlying data truly changes

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
    // Ensure endPage does not exceed totalPages, especially if totalPages is small
    if (totalPages > 0 && endPage > totalPages) {
      endPage = totalPages;
    }
    // Ensure start page is not less than 1
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
            <button className={styles.filterButton} title="Filter">
              <i className="fa-regular fa-filter"></i>
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
        filteredStaff.length > 0 && ( // Also check if filteredStaff has items before showing pagination
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
