import React, { useState, useEffect, useMemo } from "react";
import styles from "../component_styles/Reservations.module.css";

// Update the StatCard component to accept an 'animate' prop
interface StatCardProps {
  title: string;
  value: string;
  dateRange: string;
  valueIconClass?: string;
  dateRangeColor?: string;
  dateRangeBg?: string;
  animate?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  dateRange,
  valueIconClass,
  dateRangeColor = "#6c757d",
  dateRangeBg = "red",
  animate = false,
}) => {
  return (
    <div className={`${styles.statCard} ${animate ? styles.animate : ""}`}>
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

// Export the ReservationItem interface
export interface ReservationItem {
  id: string;
  customerId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: string;
  confirmationTime?: Date;
  paymentReceived: boolean;
  guests: {
    adults: number;
    children: number;
    seniors: number;
  };
  auditedBy?: string;
  type: "online" | "direct"; // New field
}

const createMockDate = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0
): Date => {
  return new Date(year, month - 1, day, hour, minute);
};

// Export the reservation data
export const reservationsData: ReservationItem[] = [
  {
    id: "A1189",
    customerId: "cust101",
    roomId: "R001",
    checkIn: createMockDate(2025, 5, 6, 14, 0),
    checkOut: createMockDate(2025, 5, 8, 12, 0),
    status: "Accepted",
    confirmationTime: createMockDate(2025, 4, 15, 11, 0),
    paymentReceived: true,
    guests: {
      adults: 2,
      children: 1,
      seniors: 0,
    },
    auditedBy: "staff001",
    type: "online",
  },
  {
    id: "A1701",
    customerId: "cust102",
    roomId: "R002",
    checkIn: createMockDate(2025, 5, 5, 15, 0),
    checkOut: createMockDate(2025, 5, 8, 11, 0),
    status: "Accepted",
    confirmationTime: createMockDate(2025, 4, 20, 9, 5),
    paymentReceived: true,
    guests: {
      adults: 1,
      children: 0,
      seniors: 2,
    },
    auditedBy: "staff002",
    type: "direct",
  },
  {
    id: "A1669",
    customerId: "cust103",
    roomId: "R003",
    checkIn: createMockDate(2025, 5, 2, 18, 0),
    checkOut: createMockDate(2025, 5, 4, 10, 0),
    status: "Accepted",
    confirmationTime: createMockDate(2025, 4, 10, 14, 10),
    paymentReceived: true,
    guests: {
      adults: 3,
      children: 2,
      seniors: 1,
    },
    auditedBy: "staff003",
    type: "online",
  },
  {
    id: "A1526",
    customerId: "cust104",
    roomId: "R004",
    checkIn: createMockDate(2025, 5, 7, 14, 0),
    checkOut: createMockDate(2025, 5, 13, 11, 0),
    status: "Confirmed_Pending_Payment",
    paymentReceived: false,
    guests: {
      adults: 2,
      children: 0,
      seniors: 0,
    },
    auditedBy: "staff004",
    type: "direct",
  },
  {
    id: "A1487",
    customerId: "cust105",
    roomId: "R005",
    checkIn: createMockDate(2025, 5, 4, 10, 0),
    checkOut: createMockDate(2025, 5, 7, 9, 0),
    status: "Accepted",
    confirmationTime: createMockDate(2025, 4, 25, 11, 15),
    paymentReceived: true,
    guests: {
      adults: 4,
      children: 3,
      seniors: 0,
    },
    auditedBy: "staff005",
    type: "online",
  },
  {
    id: "A1666",
    customerId: "cust106",
    roomId: "R006",
    checkIn: createMockDate(2025, 5, 7, 16, 0),
    checkOut: createMockDate(2025, 5, 10, 11, 0),
    status: "Cancelled",
    paymentReceived: false,
    guests: {
      adults: 2,
      children: 1,
      seniors: 0,
    },
    auditedBy: "staff006",
    type: "direct",
  },
  {
    id: "A1234",
    customerId: "cust107",
    roomId: "R007",
    checkIn: createMockDate(2025, 5, 8, 14, 0),
    checkOut: createMockDate(2025, 5, 9, 12, 0),
    status: "Pending",
    paymentReceived: false,
    guests: {
      adults: 1,
      children: 0,
      seniors: 0,
    },
    auditedBy: "staff007",
    type: "online",
  },
  {
    id: "A5678",
    customerId: "cust108",
    roomId: "R008",
    checkIn: createMockDate(2025, 5, 10, 13, 0),
    checkOut: createMockDate(2025, 5, 14, 11, 0),
    status: "Accepted",
    confirmationTime: createMockDate(2025, 5, 1, 8, 30),
    paymentReceived: true,
    guests: {
      adults: 2,
      children: 2,
      seniors: 1,
    },
    auditedBy: "staff008",
    type: "direct",
  },
  {
    id: "A9101",
    customerId: "cust109",
    roomId: "R009",
    checkIn: createMockDate(2025, 5, 11, 15, 0),
    checkOut: createMockDate(2025, 5, 13, 10, 0),
    status: "Accepted",
    confirmationTime: createMockDate(2025, 5, 5, 12, 5),
    paymentReceived: true,
    guests: {
      adults: 3,
      children: 0,
      seniors: 2,
    },
    auditedBy: "staff009",
    type: "online",
  },
  {
    id: "A1121",
    customerId: "cust110",
    roomId: "R010",
    checkIn: createMockDate(2025, 5, 12, 14, 0),
    checkOut: createMockDate(2025, 5, 13, 11, 0),
    status: "Rejected",
    paymentReceived: false,
    guests: {
      adults: 1,
      children: 0,
      seniors: 0,
    },
    auditedBy: "staff010",
    type: "direct",
  },
];

// Sort reservationsData by checkIn date in ascending order
reservationsData.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());

const formatDateForDisplay = (date: Date | undefined): string => {
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const customerLookup: { [key: string]: { name: string; phone: string } } = {
  cust101: { name: "Ledesma, Marben Jhon", phone: "0972 786 8762" },
  cust102: { name: "Lozada, Daven Jerthrude", phone: "0954 435 5243" },
  cust103: { name: "Rafael, Earl John", phone: "0912 653 7887" },
  cust104: { name: "Recede, Jhon Biancent", phone: "0930 546 2123" },
  cust105: { name: "Segura, Paul Justin", phone: "0943 6654 7665" },
  cust106: { name: "James, LeBron", phone: "0965 544 2109" },
  cust107: { name: "Smith, Jane", phone: "0911 222 3333" },
  cust108: { name: "Doe, John", phone: "0988 777 6666" },
  cust109: { name: "Garcia, Maria", phone: "0922 333 4444" },
  cust110: { name: "Williams, David", phone: "0933 444 5555" },
};

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

type StatusCategory = "Accepted" | "Pending" | "Cancelled" | "Rejected" | "Expired" | "Confirmed_Pending_Payment";

const getStatusCategory = (rawStatus: string): StatusCategory => {
  const upperStatus = rawStatus.toUpperCase();
  if (upperStatus.includes("ACCEPTED")) return "Accepted";
  if (upperStatus.includes("PENDING")) return "Pending";
  if (upperStatus.includes("CANCELLED")) return "Cancelled";
  if (upperStatus.includes("REJECTED")) return "Rejected";
  if (upperStatus.includes("EXPIRED")) return "Expired";
  if (upperStatus.includes("CONFIRMED_PENDING_PAYMENT")) return "Confirmed_Pending_Payment";
  return "Pending";
};

// Status description map
const statusDescriptions: Record<string, string> = {
  "Pending": "Submitted by customer",
  "Cancelled": "Set by customer only while status is still Pending",
  "Confirmed_Pending_Payment": "Set by staff/admin upon approval",
  "Accepted": "Set manually by staff after verifying downpayment",
  "Rejected": "Set by staff/admin upon rejection",
  "Expired": "Automatically set by the system after 48 hours without payment"
};

const staffLookup: { [key: string]: string } = {
  staff001: "Torremoro, Regine",
  staff002: "Cruz, Carlos",
  staff003: "Santos, Ana",
  staff004: "Reyes, Miguel",
  staff005: "Bautista, Sofia",
  staff006: "Aquino, Jennifer",
  staff007: "Mendoza, Ramon",
  staff008: "Villanueva, Isabel",
  staff009: "Dela Cruz, Antonio",
  staff010: "Garcia, Maria Luisa",
  staff011: "Tan, Joseph",
  staff012: "Flores, Christine",
  staff015: "Pascual, Eduardo"
};

const Reservations = () => {
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentReservations, setCurrentReservations] = useState<ReservationItem[]>(
    []
  );
  const [animateTable, setAnimateTable] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    setAnimateStats(false);
    const timer = setTimeout(() => setAnimateStats(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const filteredReservations = useMemo(() => {
    let reservations = reservationsData;
    if (statusFilter !== "all") {
      reservations = reservations.filter(
        (reservation) => getStatusCategory(reservation.status) === statusFilter
      );
    }
    if (!searchTerm.trim()) {
      return reservations;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return reservations.filter((reservation) => {
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
  }, [searchTerm, statusFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredReservations.length / ITEMS_PER_PAGE));
  }, [filteredReservations]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

  const tableBodyContent = useMemo(() => {
    if (currentReservations.length > 0) {
      return currentReservations.map((item) => {
        const statusCategory = getStatusCategory(item.status);
        const totalGuests = item.guests.adults + item.guests.children + item.guests.seniors;

        return (
          <tr key={item.id}>
            <td>{customerLookup[item.customerId]?.name || "N/A"}</td>
            <td>{item.customerId}</td>
            <td>{item.id}</td>
            <td>{roomLookup[item.roomId]?.name || item.roomId}</td>
            <td>{formatDateForDisplay(item.checkIn)}</td>
            <td>{formatDateForDisplay(item.checkOut)}</td>
            <td>{customerLookup[item.customerId]?.phone || "N/A"}</td>
            <td>{item.guests.adults}</td>
            <td>{item.guests.children}</td>
            <td>{item.guests.seniors}</td>
            <td><strong>{totalGuests}</strong></td>
            <td>
              <span
                className={`${styles.statusPillGeneral} ${
                  styles[`status${statusCategory}`]
                }`}
                title={statusDescriptions[statusCategory]}
              >
                {statusCategory.replace("_", " ")}
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
            <td>
              <span
                className={`${styles.statusPillGeneral} ${
                  item.type === "online" ? styles.typeOnline : styles.typeDirect
                }`}
              >
                {item.type === "online" ? "Online" : "Direct"}
              </span>
            </td>
            <td>
              {item.auditedBy ? staffLookup[item.auditedBy] || item.auditedBy : "N/A"}
            </td>
          </tr>
        );
      });
    } else {
      return (
        <tr>
          <td colSpan={15} className={styles.noReservationsCell}>
            {searchTerm ? "No reservations found." : "No reservations."}
          </td>
        </tr>
      );
    }
  }, [currentReservations, searchTerm]);

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
            animate={animateStats}
          />
          <StatCard
            title="Total Check-outs"
            value="29"
            valueIconClass="fa-regular fa-person-from-portal"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#6c757d"
            dateRangeBg="#f8f9fa"
            animate={animateStats}
          />
          <StatCard
            title="Total Guests"
            value="24"
            valueIconClass="fa-regular fa-people-simple"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#6c757d"
            dateRangeBg="#f8f9fa"
            animate={animateStats}
          />
          <StatCard
            title="Occupancy Rate"
            value="24"
            valueIconClass="fa-regular fa-chart-line"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#6c757d"
            dateRangeBg="#f8f9fa"
            animate={animateStats}
          />
        </div>

        <div className={styles.reservationListSection}>
          <div className={styles.listHeader}>
            <h2 className={styles.listTitle}>Reservation List</h2>
            <div className={styles.actionButtons}>
              <div className={styles.listControls}>
                <div className={styles.statusFilterWrapper}>
                  <div className={styles.iconTooltipWrapper}>
                    <select 
                      className={styles.statusFilter}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Expired">Expired</option>
                      <option value="Confirmed_Pending_Payment">Confirmed Pending Payment</option>
                    </select>
                    <span className={styles.tooltipText}>Filter by status</span>
                  </div>
                </div>
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
                <div className={styles.iconTooltipWrapper}>
                  <button className={styles.filterButton}>
                    <i className="fa-regular fa-filter"></i>
                    <span className={styles.tooltipText}>Filter</span>
                  </button>
                </div>
              </div>
              <div className={styles.exportAction}>
                <div className={styles.iconTooltipWrapper}>
                  <button className={styles.exportButton}>
                    <i className="fa-regular fa-file-export"></i>
                    <span className={styles.tooltipText}>Export</span>
                  </button>
                </div>
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
                  <th>Check-out</th>
                  <th>Phone</th>
                  <th>Adults</th>
                  <th>Children</th>
                  <th>Seniors</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Confirmation</th>
                  <th>Payment</th>
                  <th>Type</th> {/* New column */}
                  <th>Audited By</th>
                </tr>
              </thead>
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