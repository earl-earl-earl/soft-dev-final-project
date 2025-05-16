import React from 'react';
import styles from '../component_styles/StaffFeature.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const handleNextPage = () => {
    onPageChange(Math.min(currentPage + 1, totalPages));
  };

  const handlePrevPage = () => {
    onPageChange(Math.max(currentPage - 1, 1));
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  return (
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
            onClick={() => onPageChange(page)}
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
        disabled={currentPage === totalPages}
        className={styles.pageButton}
      >
        Next <i className="fa-regular fa-chevron-right"></i>
      </button>
    </nav>
  );
};

export default Pagination;