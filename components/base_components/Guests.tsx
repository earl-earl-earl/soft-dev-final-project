"use client";

import { useState, useMemo, useEffect } from "react";
import styles from "../component_styles/Guests.module.css";

interface Booking {
  userId: string;
  name: string;
  room: string;
  phoneNumber: string;
  guests: number;
  createdAt: string | Date;
  loginAt: string | Date;
  updatedAt: string | Date;
  isActive: boolean;
}

const mockBookings: Booking[] = [
  {
    userId: "USR001",
    name: "Ledesma, Marben Jhon",
    room: "Ohana",
    phoneNumber: "0972 786 8762",
    guests: 3,
    createdAt: "2023-10-01T10:00:00Z",
    loginAt: "2023-10-28T09:15:00Z",
    updatedAt: "2023-10-28T11:30:00Z",
    isActive: true,
  },
  {
    userId: "USR002",
    name: "Lozada, Daven Jerthrude",
    room: "Resthouse",
    phoneNumber: "0954 435 5243",
    guests: 1,
    createdAt: "2023-10-02T11:30:00Z",
    loginAt: "2023-10-27T14:00:00Z",
    updatedAt: "2023-10-27T14:05:00Z",
    isActive: false,
  },
  {
    userId: "USR003",
    name: "Rafael, Earl John",
    room: "Camille",
    phoneNumber: "0912 653 7887",
    guests: 1,
    createdAt: "2023-10-05T08:20:00Z",
    loginAt: "2023-10-29T10:00:00Z",
    updatedAt: "2023-10-29T10:10:00Z",
    isActive: true,
  },
  {
    userId: "USR004",
    name: "Recede, Jhon Biancent",
    room: "Phillip",
    phoneNumber: "0930 546 2123",
    guests: 2,
    createdAt: "2023-10-10T14:00:00Z",
    loginAt: "2023-10-26T16:30:00Z",
    updatedAt: "2023-10-26T17:00:00Z",
    isActive: false,
  },
  {
    userId: "USR005",
    name: "Segura, Paul Justin",
    room: "Kyle",
    phoneNumber: "0943 6654 7665",
    guests: 1,
    createdAt: "2023-10-12T09:00:00Z",
    loginAt: "2023-10-25T11:00:00Z",
    updatedAt: "2023-10-25T11:05:00Z",
    isActive: true,
  },
  {
    userId: "USR006",
    name: "James, LeBron",
    room: "Emil",
    phoneNumber: "0965 544 2109",
    guests: 1,
    createdAt: "2023-10-15T16:45:00Z",
    loginAt: "2023-10-28T13:20:00Z",
    updatedAt: "2023-10-28T13:22:00Z",
    isActive: true,
  },
  {
    userId: "USR007",
    name: "Ledesma, Marben Jhon (2)",
    room: "Ohana",
    phoneNumber: "0972 786 8763",
    guests: 3,
    createdAt: "2023-11-01T10:00:00Z",
    loginAt: "2023-11-08T09:15:00Z",
    updatedAt: "2023-11-08T11:30:00Z",
    isActive: false,
  },
  {
    userId: "USR008",
    name: "Lozada, Daven Jerthrude (2)",
    room: "Resthouse",
    phoneNumber: "0954 435 5244",
    guests: 1,
    createdAt: "2023-11-02T11:30:00Z",
    loginAt: "2023-11-07T14:00:00Z",
    updatedAt: "2023-11-07T14:05:00Z",
    isActive: true,
  },
  {
    userId: "USR009",
    name: "Rafael, Earl John (2)",
    room: "Camille",
    phoneNumber: "0912 653 7888",
    guests: 1,
    createdAt: "2023-11-05T08:20:00Z",
    loginAt: "2023-11-09T10:00:00Z",
    updatedAt: "2023-11-09T10:10:00Z",
    isActive: false,
  },
  {
    userId: "USR010",
    name: "Recede, Jhon Biancent (2)",
    room: "Phillip",
    phoneNumber: "0930 546 2124",
    guests: 2,
    createdAt: "2023-11-10T14:00:00Z",
    loginAt: "2023-11-06T16:30:00Z",
    updatedAt: "2023-11-06T17:00:00Z",
    isActive: true,
  },
  {
    userId: "USR011",
    name: "Segura, Paul Justin (2)",
    room: "Kyle",
    phoneNumber: "0943 6654 7666",
    guests: 1,
    createdAt: "2023-11-12T09:00:00Z",
    loginAt: "2023-11-05T11:00:00Z",
    updatedAt: "2023-11-05T11:05:00Z",
    isActive: true,
  },
  {
    userId: "USR012",
    name: "James, LeBron (2)",
    room: "Emil",
    phoneNumber: "0965 544 2110",
    guests: 1,
    createdAt: "2023-11-15T16:45:00Z",
    loginAt: "2023-11-08T13:20:00Z",
    updatedAt: "2023-11-08T13:22:00Z",
    isActive: false,
  },
];

const ITEMS_PER_PAGE = 8;

export default function Guests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [animateTable, setAnimateTable] = useState(false);
  const [sortByActive /* setSortByActive */] = useState(true);

  useEffect(() => {
    setAnimateTable(false);

    const timer = setTimeout(() => setAnimateTable(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const filteredData = useMemo(() => {
    let dataToFilter = mockBookings;

    if (searchTerm) {
      dataToFilter = dataToFilter.filter((booking) =>
        Object.values(booking).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return [...dataToFilter].sort((a, b) => {
      if (sortByActive) {
        return Number(b.isActive) - Number(a.isActive);
      } else {
        return 0;
      }
    });
  }, [searchTerm, sortByActive]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const lastPageIndex = firstPageIndex + ITEMS_PER_PAGE;
    return filteredData.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData]);

  const formatDate = (dateInput: string | Date | undefined): string => {
    if (!dateInput) return "N/A";
    return new Date(dateInput).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxButtonsToShow = 4;
    let startPage = Math.max(
      1,
      currentPage - Math.floor((maxButtonsToShow - 1) / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

    if (endPage - startPage + 1 < maxButtonsToShow) {
      if (currentPage < totalPages / 2) {
        endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);
      } else {
        startPage = Math.max(1, endPage - maxButtonsToShow + 1);
      }
    }
    while (endPage - startPage + 1 < maxButtonsToShow && startPage > 1) {
      startPage--;
    }
    while (endPage - startPage + 1 < maxButtonsToShow && endPage < totalPages) {
      endPage++;
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const tableHeaders = [
    "User ID",
    "Name",
    "Room",
    "Phone Number",
    "Guests",
    "Created At",
    "Login At",
    "Updated At",
    "Active Status",
  ];

  return (
    <div className={styles.container}>
      <div className={styles.topContent}>
        <div className={styles.listHeader}>
          <div className={styles.listControls}>
            <div className={styles.searchBar}>
              <div className={styles.searchIcon}>
                <i className="fa-regular fa-magnifying-glass"></i>{" "}
              </div>
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.searchInput}
              />
              <button className={styles.filterButton}>
                <i className="fa-regular fa-filter"></i>
                <span className={styles.tooltipText}>Filter</span>
              </button>
            </div>
          </div>
        </div>

        <div
          className={`${styles.tableContainer} ${
            animateTable ? styles.tableFadeIn : ""
          }`}
        >
          <table className={styles.reservationTable}>
            <thead>
              <tr>
                {tableHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTableData.length > 0 ? (
                currentTableData.map((booking) => (
                  <tr key={booking.userId}>
                    <td>{booking.userId}</td>
                    <td>{booking.name}</td>
                    <td>{booking.room}</td>
                    <td>{booking.phoneNumber}</td>
                    <td className={styles.guestsCell}>{booking.guests}</td>
                    <td>{formatDate(booking.createdAt)}</td>
                    <td>{formatDate(booking.loginAt)}</td>
                    <td>{formatDate(booking.updatedAt)}</td>
                    <td className={styles.statusCell}>
                      <span
                        className={`${styles.statusCircle} ${
                          booking.isActive
                            ? styles.statusOnline
                            : styles.statusOffline
                        }`}
                        title={booking.isActive ? "Online" : "Offline"}
                      ></span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={tableHeaders.length}
                    className={styles.noReservationsCell}
                  >
                    No guests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            <i className="fa-regular fa-angle-left"></i> Previous{" "}
          </button>

          <div className={styles.paginationNumbers}>
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`${styles.paginationNumberButton} ${
                  currentPage === page ? styles.activePage : ""
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next <i className="fa-regular fa-angle-right"></i>{" "}
          </button>
        </div>
      )}
    </div>
  );
}
