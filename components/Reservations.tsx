import React, { useState, useEffect, useMemo } from "react";
import styles from "./Reservations.module.css";

interface StatCardProps {
  title: string;
  value: string;
  dateRange: string;
  valueIconClass?: string;
  dateRangeColor?: string;
  dateRangeBg?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  dateRange,
  valueIconClass,
  dateRangeColor = "#6c757d",
  dateRangeBg = "red",
}) => {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardTop}>
        <p className={styles.statTitle}>{title}</p>
        <div className={styles.statValueContainer}>
          <h3 className={styles.statValue}>{value}</h3>
          {valueIconClass && (
            <i className={`${valueIconClass} ${styles.statValueIcon}`}></i>
          )}
        </div>
      </div>
      <div
        className={styles.statCardBottom}
        style={{ backgroundColor: dateRangeBg }}
      >
        <p className={styles.statDateRange} style={{ color: dateRangeColor }}>
          {dateRange}
        </p>
      </div>
    </div>
  );
};

// Interface strictly based on diagram attributes, NO GUESTS, NO pre-derived name
interface ReservationItem {
  id: string;
  customerId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: string; // Raw backend status
  confirmationTime?: Date;
  paymentReceived: boolean;
}

// Helper to create dates
const createMockDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date => {
  return new Date(year, month - 1, day, hour, minute);
};

// Source data adhering to the STRICT ReservationItem
const reservationsData: ReservationItem[] = [
  {
    id: "A1189",
    customerId: "cust101",
    roomId: "R001",
    checkIn: createMockDate(2025, 5, 6, 14, 0),
    checkOut: createMockDate(2025, 5, 8, 12, 0),
    status: "CONFIRMED_CHECKED_IN",
    confirmationTime: createMockDate(2025, 4, 15, 11, 0),
    paymentReceived: true,
  },
  {
    id: "A1701",
    customerId: "cust102",
    roomId: "R002",
    checkIn: createMockDate(2025, 5, 5, 15, 0),
    checkOut: createMockDate(2025, 5, 8, 11, 0),
    status: "CONFIRMED_ARRIVING",
    confirmationTime: createMockDate(2025, 4, 20, 9, 5),
    paymentReceived: true,
  },
  {
    id: "A1669",
    customerId: "cust103",
    roomId: "R003",
    checkIn: createMockDate(2025, 5, 2, 18, 0),
    checkOut: createMockDate(2025, 5, 4, 10, 0),
    status: "CONFIRMED_ARRIVED_LATE",
    confirmationTime: createMockDate(2025, 4, 10, 14, 10),
    paymentReceived: true,
  },
  {
    id: "A1526",
    customerId: "cust104",
    roomId: "R004",
    checkIn: createMockDate(2025, 5, 7, 14, 0),
    checkOut: createMockDate(2025, 5, 13, 11, 0),
    status: "PENDING_PAYMENT",
    paymentReceived: false,
  },
  {
    id: "A1487",
    customerId: "cust105",
    roomId: "R005",
    checkIn: createMockDate(2025, 5, 4, 10, 0),
    checkOut: createMockDate(2025, 5, 7, 9, 0),
    status: "COMPLETED_CHECKED_OUT",
    confirmationTime: createMockDate(2025, 4, 25, 11, 15),
    paymentReceived: true,
  },
  {
    id: "A1666",
    customerId: "cust106",
    roomId: "R006",
    checkIn: createMockDate(2025, 5, 7, 16, 0),
    checkOut: createMockDate(2025, 5, 10, 11, 0),
    status: "CANCELLED_BY_USER",
    paymentReceived: false,
  },
  {
    id: "A1234",
    customerId: "cust107",
    roomId: "R007",
    checkIn: createMockDate(2025, 5, 8, 14, 0),
    checkOut: createMockDate(2025, 5, 9, 12, 0),
    status: "PENDING_CONFIRMATION",
    paymentReceived: false,
  },
  {
    id: "A5678",
    customerId: "cust108",
    roomId: "R008",
    checkIn: createMockDate(2025, 5, 10, 13, 0),
    checkOut: createMockDate(2025, 5, 14, 11, 0),
    status: "CONFIRMED_CHECKED_IN",
    confirmationTime: createMockDate(2025, 5, 1, 8, 30),
    paymentReceived: true,
  },
  {
    id: "A9101",
    customerId: "cust109",
    roomId: "R009",
    checkIn: createMockDate(2025, 5, 11, 15, 0),
    checkOut: createMockDate(2025, 5, 13, 10, 0),
    status: "CONFIRMED_ARRIVING",
    confirmationTime: createMockDate(2025, 5, 5, 12, 5),
    paymentReceived: true,
  },
  {
    id: "A1121",
    customerId: "cust110",
    roomId: "R010",
    checkIn: createMockDate(2025, 5, 12, 14, 0),
    checkOut: createMockDate(2025, 5, 13, 11, 0),
    status: "CANCELLED_ADMIN",
    paymentReceived: false,
  },
];

// Utility function to format Date object for display
const formatDateForDisplay = (date: Date | undefined): string => {
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

// Mock data for customer lookup (name and phone)
const customerLookup: { [key: string]: { name: string; phone: string } } = {
  cust101: { name: "Ledesma, Marben Jhon", phone: "0972 786 8762" },
  cust102: { name: "Lozada, Daven Jerthrude", phone: "0954 435 5243" },
  cust103: { name: "Rafael, Earl John", phone: "0912 653 7887" },
  cust104: { name: "Recede, Jhon Biancent", phone: "0930 546 2123" },
  cust105: { name: "Segura, Paul Justine", phone: "0943 6654 7665" },
  cust106: { name: "James, LeBron", phone: "0965 544 2109" },
  cust107: { name: "Smith, Jane", phone: "0911 222 3333" },
  cust108: { name: "Doe, John", phone: "0988 777 6666" },
  cust109: { name: "Garcia, Maria", phone: "0922 333 4444" },
  cust110: { name: "Williams, David", phone: "0933 444 5555" },
};

// Mock data for Room lookup
const roomLookup: { [key: string]: { name: string } } = {
  R001: { name: "Ohana" },
  R002: { name: "Resthouse" },
  R003: { name: "Camille" },
  R004: { name: "Phillip" },
  R005: { name: "Kyle" },
  R006: { name: "Emil" },
  R007: { name: "Deluxe Suite" },
  R008: { name: "Standard" },
  R009: { name: "Family Room" },
  R010: { name: "Bungalow" },
};

type StatusCategory = "Confirmed" | "Pending" | "Cancelled" | "Other";
const getStatusCategory = (rawStatus: string): StatusCategory => {
  const upperStatus = rawStatus.toUpperCase();
  if (
    upperStatus.includes("CONFIRMED") ||
    upperStatus.includes("CHECKED_IN") ||
    upperStatus.includes("ARRIVING") ||
    upperStatus.includes("ARRIVED_LATE") ||
    upperStatus.includes("COMPLETED")
  )
    return "Confirmed";
  if (upperStatus.includes("PENDING")) return "Pending";
  if (upperStatus.includes("CANCELLED")) return "Cancelled";
  return "Other";
};

const Reservations = () => {
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentReservations, setCurrentReservations] = useState<
    ReservationItem[]
  >([]);
  const [animateTable, setAnimateTable] = useState(false);

  const filteredReservations = useMemo(() => {
    if (!searchTerm.trim()) {
      return reservationsData;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return reservationsData.filter((reservation) => {
      const customerName = customerLookup[reservation.customerId]?.name || "";
      const customerPhone = customerLookup[reservation.customerId]?.phone || "";
      const roomName = roomLookup[reservation.roomId]?.name || "";
      const statusCategory = getStatusCategory(
        reservation.status
      ).toLowerCase();
      return (
        reservation.id.toLowerCase().includes(lowerSearchTerm) ||
        customerName.toLowerCase().includes(lowerSearchTerm) ||
        customerPhone
          .replace(/\s+/g, "")
          .includes(lowerSearchTerm.replace(/\s+/g, "")) ||
        roomName.toLowerCase().includes(lowerSearchTerm) ||
        reservation.customerId.toLowerCase().includes(lowerSearchTerm) ||
        reservation.roomId.toLowerCase().includes(lowerSearchTerm) ||
        reservation.status.toLowerCase().includes(lowerSearchTerm) ||
        statusCategory.includes(lowerSearchTerm)
      );
    });
  }, [searchTerm]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredReservations.length / ITEMS_PER_PAGE));
  }, [filteredReservations]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    setAnimateTable(false);
    let newCurrentPage = currentPage;
    if (newCurrentPage > totalPages) {
      newCurrentPage = totalPages > 0 ? totalPages : 1;
      setCurrentPage(newCurrentPage);
      return;
    }
    if (newCurrentPage < 1) {
      newCurrentPage = 1;
      setCurrentPage(newCurrentPage);
      return;
    }
    const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setCurrentReservations(filteredReservations.slice(startIndex, endIndex));
    const timer = setTimeout(() => setAnimateTable(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage, filteredReservations, totalPages]);

  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handlePageClick = (pageNumber: number) => setCurrentPage(pageNumber);
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (
      totalPages > maxPagesToShow &&
      endPage - startPage + 1 < maxPagesToShow
    ) {
      if (currentPage < totalPages / 2)
        endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      else startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    if (totalPages > 0 && endPage > totalPages) endPage = totalPages;
    if (startPage < 1 && totalPages > 0) startPage = 1;
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    return pageNumbers;
  };

  // This useMemo is critical for preventing whitespace issues and for performance
  const tableBodyContent = useMemo(() => {
    if (currentReservations.length > 0) {
      return currentReservations.map((item) => {
        const statusCategory = getStatusCategory(item.status);
        let statusText = item.status;
        if (statusCategory === "Confirmed") statusText = "Confirmed";
        if (statusCategory === "Pending") statusText = "Pending";
        if (statusCategory === "Cancelled") statusText = "Cancelled";

        // Compact JSX for each row
        return (
          <tr key={item.id}>
            <td>{customerLookup[item.customerId]?.name || "N/A"}</td>
            <td>{item.customerId}</td>
            <td>{item.id}</td>
            <td>{roomLookup[item.roomId]?.name || item.roomId}</td>
            <td>{formatDateForDisplay(item.checkIn)}</td>
            <td>{customerLookup[item.customerId]?.phone || "N/A"}</td>
            <td>
              <span
                className={`${styles.statusPillGeneral} ${
                  styles[`status${statusCategory}`]
                }`}
              >
                {statusText}
              </span>
            </td>
            <td>
              {item.confirmationTime
                ? formatDateForDisplay(item.confirmationTime)
                : "N/A"}
            </td>
            <td>
              <span
                className={`${styles.statusPillGeneral} ${
                  item.paymentReceived
                    ? styles.paymentPaid
                    : styles.paymentNotPaid
                }`}
              >
                {item.paymentReceived ? "Paid" : "Not Paid"}
              </span>
            </td>
          </tr>
        );
      });
    } else {
      // Compact JSX for the "no results" row
      return (
        <tr>
          <td colSpan={9} className={styles.noReservationsCell}>
            {searchTerm ? "No reservations found." : "No reservations."}
          </td>
        </tr>
      );
    }
  }, [currentReservations, searchTerm]); // Dependencies on what's used inside the map or conditional

  return (
    <div className={styles.container}>
      <div className={styles.topContent}>
        <div className={styles.headerTabs}>
          <div className={styles.tabs}>
            <button className={`${styles.tabButton} ${styles.activeTab}`}>
              <i className="fa-regular fa-list"></i> All Reservations
            </button>
            <button className={styles.tabButton}>
              <i className="fa-regular fa-mobile"></i> Online Reservations
            </button>
            <button className={styles.tabButton}>
              <i className="fa-regular fa-bell-concierge"></i> Direct
              Reservations
            </button>
          </div>
          <button className={styles.newReservationButton}>
            <i className="fa-regular fa-plus"></i> New Reservation
          </button>
        </div>

        <div className={styles.statsCardsContainer}>
          <StatCard
            title="Total Check-ins"
            value="32"
            valueIconClass="fa-regular fa-person-to-portal"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#007bff"
            dateRangeBg="#e7f3ff"
          />
          <StatCard
            title="Total Check-outs"
            value="29"
            valueIconClass="fa-regular fa-person-from-portal"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#6c757d"
            dateRangeBg="#f8f9fa"
          />
          <StatCard
            title="Total Guests"
            value="24"
            valueIconClass="fa-regular fa-people-simple"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#6c757d"
            dateRangeBg="#f8f9fa"
          />
          <StatCard
            title="Occupancy Rate"
            value="24"
            valueIconClass="fa-regular fa-chart-line"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#6c757d"
            dateRangeBg="#f8f9fa"
          />
        </div>

        <div className={styles.reservationListSection}>
          <div className={styles.listHeader}>
            <h2 className={styles.listTitle}>Reservation List</h2>
            <div className={styles.actionButtons}>
              <div className={styles.listControls}>
                <div className={styles.searchBar}>
                  <i
                    className={`fa-regular fa-magnifying-glass ${styles.searchIcon}`}
                  ></i>
                  <input
                    type="text"
                    placeholder="Search..."
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className={styles.filterButton}>
                  <i className="fa-regular fa-filter"></i>
                  <span className={styles.tooltipText}>Filter</span> {/* Added tooltip */}
                </button>
              </div>
              <div className={styles.exportAction}>
                <button className={styles.exportButton}>
                  <i className="fa-regular fa-file-export"></i>
                  <span className={styles.tooltipText}>Export</span> {/* Added tooltip */}
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
                  <th>Name</th>
                  <th>Customer ID</th>
                  <th>Res. ID</th>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Confirmation</th>
                  <th>Payment</th>
                </tr>
              </thead>
              {/* Directly render the memoized content */}
              <tbody>{tableBodyContent}</tbody>
            </table>
          </div>
        </div>
      </div>
      {filteredReservations.length > 0 && totalPages > 1 && (
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
                onClick={() => handlePageClick(page)}
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
      )}
    </div>
  );
};

export default Reservations;