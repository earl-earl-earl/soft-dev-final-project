import React from "react";
import styles from "../../components/component_styles/Reservations.module.css";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const handleNextPage = () => onPageChange(Math.min(currentPage + 1, totalPages));
  const handlePrevPage = () => onPageChange(Math.max(currentPage - 1, 1));
  
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages === 0) return []; // No pages to show

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        } else {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={styles.paginationContainer}>
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 1}
        className={styles.paginationButton}
      >
        <i
          className="fa-regular fa-angle-left"
          style={{ marginRight: "5px" }}
        ></i>{" "}
        Previous
      </button>
      <div className={styles.paginationNumbers}>
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`${styles.paginationNumberButton} ${
              currentPage === page ? styles.activePage : ""
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages || totalPages === 0}
        className={styles.paginationButton}
      >
        Next{" "}
        <i
          className="fa-regular fa-angle-right"
          style={{ marginLeft: "5px" }}
        ></i>
      </button>
    </div>
  );
};

export default Pagination;