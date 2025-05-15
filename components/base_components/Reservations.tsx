import React, { useState, useEffect, useMemo } from "react";
import styles from "../component_styles/Reservations.module.css";
import NewReservationOverlay, { ReservationData } from "../overlay_components/NewReservationOverlay";
import FilterOverlay, { FilterOptions } from "../overlay_components/FilterOverlay";
import ExportOverlay from "../overlay_components/ExportOverlay";
import ReservationDetailsOverlay from "../overlay_components/ReservationDetailsOverlay";
import { submitReservation } from "@/contexts/newReservation";
import { fetchReservations } from "@/utils/fetchReservations";

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
  type: "online" | "direct";
  notes?: string; // Add this field for reservation notes
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
    notes: "Guest requested early check-in if possible. Allergic to seafood. Celebrating wedding anniversary.",
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
    notes: "Returning guest. Prefers room away from elevator. May require airport pickup service.",
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
    notes: "Guest will be arriving late, around 9pm. Please ensure front desk is aware. Requested extra pillows.",
  }
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
  cust103: { name: "Rafael, Earl John", phone: "0912 653 7887" }
};

const roomLookup: { [key: string]: { name: string } } = {
  R001: { name: "Ohana" },
  R002: { name: "Resthouse" },
  R003: { name: "Camille" },
};

type StatusCategory = "Accepted" | "Pending" | "Cancelled" | "Rejected" | "Expired" | "Confirmed_Pending_Payment";

// Replace the getStatusCategory function with this improved version
const getStatusCategory = (rawStatus: string): StatusCategory => {
  // Make an exact match instead of a partial match
  const status = rawStatus.trim();
  
  if (status === "Accepted") return "Accepted";
  if (status === "Pending") return "Pending";
  if (status === "Cancelled") return "Cancelled";
  if (status === "Rejected") return "Rejected";
  if (status === "Expired") return "Expired";
  if (status === "Confirmed_Pending_Payment") return "Confirmed_Pending_Payment";
  
  // For backward compatibility, if we don't have an exact match:
  const upperStatus = status.toUpperCase();
  if (upperStatus.includes("ACCEPTED")) return "Accepted";
  if (upperStatus.includes("CONFIRMED") && upperStatus.includes("PENDING")) return "Confirmed_Pending_Payment";
  if (upperStatus.includes("PENDING")) return "Pending";
  if (upperStatus.includes("CANCELLED")) return "Cancelled";
  if (upperStatus.includes("REJECTED")) return "Rejected";
  if (upperStatus.includes("EXPIRED")) return "Expired";
  
  return "Pending"; // Default fallback
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
  staff001: "Suarez, Reign",
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
  const [reservationType, setReservationType] = useState<"all" | "online" | "direct">("all"); // New state
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // New filter state
  const [filterOptions, setFilterOptions] = useState({
    checkInStart: '',
    checkInEnd: '',
    checkOutStart: '',
    checkOutEnd: '',
    paymentStatus: 'all',
    minGuests: '',
    maxGuests: '',
    roomId: 'all'
  }); // New filter options state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null); // New state
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnimateStats(false);
    const timer = setTimeout(() => setAnimateStats(true), 50);
    return () => clearTimeout(timer);
  }, [reservationType]); // Add reservationType dependency

  // Generate available rooms from the roomLookup for the overlay
  useEffect(() => {
    const rooms = Object.entries(roomLookup).map(([id, details]) => `${details.name} (${id})`);
    setAvailableRooms(rooms);
  }, []);

  const roomOptions = Object.entries(roomLookup).map(([id, details]) => ({
    id,
    name: details.name
  }));

  const filteredReservations = useMemo(() => {
    // Use reservations from state instead of mock data
    let reservationsList = reservations;
    
    // Filter by reservation type
    if (reservationType !== "all") {
      reservationsList = reservationsList.filter(reservation => reservation.type === reservationType);
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      reservationsList = reservationsList.filter(
        (reservation) => getStatusCategory(reservation.status) === statusFilter
      );
    }
    
    // Apply advanced filters
    if (filterOptions.checkInStart) {
      const startDate = new Date(filterOptions.checkInStart);
      reservationsList = reservationsList.filter(r => r.checkIn >= startDate);
    }
    
    if (filterOptions.checkInEnd) {
      const endDate = new Date(filterOptions.checkInEnd);
      endDate.setHours(23, 59, 59);
      reservationsList = reservationsList.filter(r => r.checkIn <= endDate);
    }
    
    if (filterOptions.checkOutStart) {
      const startDate = new Date(filterOptions.checkOutStart);
      reservationsList = reservationsList.filter(r => r.checkOut >= startDate);
    }
    
    if (filterOptions.checkOutEnd) {
      const endDate = new Date(filterOptions.checkOutEnd);
      endDate.setHours(23, 59, 59);
      reservationsList = reservationsList.filter(r => r.checkOut <= endDate);
    }
    
    if (filterOptions.paymentStatus !== 'all') {
      const isPaid = filterOptions.paymentStatus === 'paid';
      reservationsList = reservationsList.filter(r => r.paymentReceived === isPaid);
    }
    
    if (filterOptions.minGuests) {
      const min = parseInt(filterOptions.minGuests);
      reservationsList = reservationsList.filter(r => {
        const total = r.guests.adults + r.guests.children + r.guests.seniors;
        return total >= min;
      });
    }
    
    if (filterOptions.maxGuests) {
      const max = parseInt(filterOptions.maxGuests);
      reservationsList = reservationsList.filter(r => {
        const total = r.guests.adults + r.guests.children + r.guests.seniors;
        return total <= max;
      });
    }
    
    if (filterOptions.roomId !== 'all') {
      reservationsList = reservationsList.filter(r => r.roomId === filterOptions.roomId);
    }
    
    // Search filter
    if (!searchTerm.trim()) {
      return reservationsList;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return reservationsList.filter((reservation) => {
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
  }, [reservations, searchTerm, statusFilter, reservationType, filterOptions]); // Add reservationType dependency

  // Calculate statistics based on current filter
  const statistics = useMemo(() => {
    // Define date range
    const startDate = new Date(2025, 0, 1);
    const endDate = new Date(2025, 3, 30); 
    
    // Filter reservations by type and date range
    let reservationsForStats = reservations; // Use state data instead of mock
    if (reservationType !== "all") {
      reservationsForStats = reservationsForStats.filter(r => r.type === reservationType);
    }
    
    // Filter for specified date range
    reservationsForStats = reservationsForStats.filter(r => 
      r.checkIn >= startDate && r.checkIn <= endDate
    );
    
    // Calculate statistics
    const checkIns = reservationsForStats.length;
    const checkOuts = reservationsForStats.filter(r => r.checkOut <= endDate).length;
    const totalGuests = reservationsForStats.reduce((sum, r) => 
      sum + r.guests.adults + r.guests.children + r.guests.seniors, 0);
    
    // For occupancy rate, assume 10 rooms with ~120 potential bookings in 4 months
    const maxPossibleBookings = reservationType === "all" ? 120 : 60;
    const occupancyRate = Math.round((checkIns / maxPossibleBookings) * 100);
    
    return { checkIns, checkOuts, totalGuests, occupancyRate };
  }, [reservations, reservationType]); // Update dependency

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
  }, [filteredReservations, ITEMS_PER_PAGE]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, reservationType]); // Add reservationType dependency

  useEffect(() => {
    setAnimateTable(false);
    let newCurrentPage = currentPage;
    
    // Handle zero pages case first
    if (totalPages === 0) {
      setCurrentReservations([]);
      const timer = setTimeout(() => setAnimateTable(true), 50);
      return () => clearTimeout(timer);
    }
    
    // Adjust current page if needed
    if (newCurrentPage > totalPages) {
      newCurrentPage = totalPages;
      setCurrentPage(newCurrentPage);
    }
    if (newCurrentPage < 1) {
      newCurrentPage = 1;
      setCurrentPage(newCurrentPage);
    }
    
    // Always update currentReservations regardless of page adjustments
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
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  // Define the status change handler before it's used in dependencies
  const handleStatusChange = React.useCallback((reservationId: string, newStatus: string) => {
    // Create a new array to avoid direct state mutation
    const updatedReservations = [...reservations];
    const index = updatedReservations.findIndex(res => res.id === reservationId);
    
    if (index !== -1) {
      // Update the status
      updatedReservations[index].status = newStatus;
      
      // Update state
      setReservations(updatedReservations);
      
      // Force update of current reservations
      setCurrentReservations(currentReservations.map(res => 
        res.id === reservationId ? {...res, status: newStatus} : res
      ));
      
      // Here you would also update the database
      // updateReservationStatus(reservationId, newStatus);
      
      console.log(`Reservation ${reservationId} status updated to ${newStatus}`);
    }
  }, [reservations, currentReservations]);

  // Make sure tableBodyContent properly shows the no results message
  const tableBodyContent = useMemo(() => {
    // Check if any filters are active
    const hasActiveFilters = searchTerm || 
      statusFilter !== "all" || 
      reservationType !== "all" ||
      filterOptions.checkInStart ||
      filterOptions.checkInEnd ||
      filterOptions.checkOutStart ||
      filterOptions.checkOutEnd ||
      filterOptions.paymentStatus !== 'all' ||
      filterOptions.minGuests ||
      filterOptions.maxGuests ||
      filterOptions.roomId !== 'all';

    if (filteredReservations.length === 0) {
      // If there are no filtered results at all
      return (
        <tr>
          <td colSpan={16} className={styles.noReservationsCell}>
            {hasActiveFilters 
              ? "No results matching your search criteria." 
              : "No reservations."}
          </td>
        </tr>
      );
    } else if (currentReservations.length === 0) {
      // If there are filtered results but none on current page
      return (
        <tr>
          <td colSpan={16} className={styles.noReservationsCell}>
            No results on this page. Please navigate to another page.
          </td>
        </tr>
      );
    }
    
    // Otherwise show the reservations
    return currentReservations.map((item) => {
      const statusCategory = getStatusCategory(item.status);
      const totalGuests = item.guests.adults + item.guests.children + item.guests.seniors;
      return (
        <tr 
          key={item.id} 
          onClick={() => handleRowClick(item)}
          className={styles.clickableRow}
        >
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
            <select 
              className={`${styles.statusDropdown} ${styles[`status${statusCategory}`]}`}
              value={item.status}
              onChange={(e) => handleStatusChange(item.id, e.target.value)}
              onClick={(e) => e.stopPropagation()} // Add this line to stop propagation
              title={statusDescriptions[getStatusCategory(item.status)]}
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed_Pending_Payment">Confirmed Pending Payment</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Expired">Expired</option>
            </select>
          </td>
          <td>{item.confirmationTime ? formatDateForDisplay(item.confirmationTime) : "N/A"}</td>
          <td><span className={`${styles.statusPillGeneral} ${item.paymentReceived ? styles.paymentPaid : styles.paymentNotPaid}`}>{item.paymentReceived ? "Paid" : "Not Paid"}</span></td>
          <td><span className={`${styles.statusPillGeneral} ${item.type === "online" ? styles.typeOnline : styles.typeDirect}`}>{item.type === "online" ? "Online" : "Direct"}</span></td>
          <td>{item.auditedBy ? staffLookup[item.auditedBy] || item.auditedBy : "N/A"}</td>
        </tr>
      );
    });
  }, [currentReservations, filteredReservations, searchTerm, statusFilter, reservationType, filterOptions, handleStatusChange]);

  // Function to handle new reservation submission
  const handleNewReservation = async (reservationData: ReservationData) => {
    const result = await submitReservation(reservationData);
  
    if (result.success) {
      alert("Reservation successfully created!");
      setIsNewReservationOpen(false);
      // Optional: refresh reservation list here if you're loading from DB
    } else {
      alert("Failed to create reservation: " + result.message);
    }
  };
  

  function handleApplyFilters(filters: FilterOptions): void {
    setFilterOptions(filters);
    setIsFilterOpen(false);
  }

  // Add this function to handle row clicks
  const handleRowClick = (reservation: ReservationItem) => {
    setSelectedReservation(reservation);
  };

  // Add this useEffect to fetch data when component mounts
  useEffect(() => {
    const loadReservations = async () => {
      setIsLoading(true);
      try {
        const data = await fetchReservations();
        if (data && data.length > 0) {
          // Transform the data to match ReservationItem interface
          const formattedData: ReservationItem[] = data.map(item => ({
            id: item.id,
            customerId: item.customer_id,
            roomId: item.room_id,
            checkIn: new Date(item.check_in),
            checkOut: new Date(item.check_out),
            status: item.status || "Pending",
            confirmationTime: item.confirmation_time ? new Date(item.confirmation_time) : undefined,
            paymentReceived: item.payment_received || false,
            guests: {
              adults: item.num_adults || 0,
              children: item.num_children || 0,
              seniors: item.num_seniors || 0,
            },
            auditedBy: item.audited_by,
            type: item.source === "online" ? "online" : "direct",
            notes: item.message,
          }));
          
          // Sort by check-in date
          formattedData.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());
          
          setReservations(formattedData);
        } else {
          // If no data, use empty array
          setReservations([]);
        }
        setError(null);
      } catch (err) {
        console.error("Error loading reservations:", err);
        setError("Failed to load reservations");
      } finally {
        setIsLoading(false);
      }
    };

    loadReservations();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.topContent}>
        <div className={styles.headerTabs}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabButton} ${reservationType === "all" ? styles.activeTab : ""}`}
              onClick={() => setReservationType("all")}
            >
              <i className="fa-regular fa-list"></i> All Reservations
            </button>
            <button 
              className={`${styles.tabButton} ${reservationType === "online" ? styles.activeTab : ""}`}
              onClick={() => setReservationType("online")}
            >
              <i className="fa-regular fa-mobile"></i> Online Reservations
            </button>
            <button 
              className={`${styles.tabButton} ${reservationType === "direct" ? styles.activeTab : ""}`}
              onClick={() => setReservationType("direct")}
            >
              <i className="fa-regular fa-bell-concierge"></i> Direct Reservations
            </button>
          </div>
          <button 
            className={styles.newReservationButton} 
            onClick={() => setIsNewReservationOpen(true)}
          >
            <i className="fa-regular fa-plus"></i> New Reservation
          </button>
        </div>

        <div className={styles.statsCardsContainer}>
          <StatCard
            title="Total Check-ins"
            value={statistics.checkIns.toString()}
            valueIconClass="fa-regular fa-person-to-portal"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#007bff"
            dateRangeBg="#e7f3ff"
            animate={animateStats}
          />
          <StatCard
            title="Total Check-outs"
            value={statistics.checkOuts.toString()}
            valueIconClass="fa-regular fa-person-from-portal"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#6c757d"
            dateRangeBg="#f8f9fa"
            animate={animateStats}
          />
          <StatCard
            title="Total Guests"
            value={statistics.totalGuests.toString()}
            valueIconClass="fa-regular fa-people-simple"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#6c757d"
            dateRangeBg="#f8f9fa"
            animate={animateStats}
          />
          <StatCard
            title="Occupancy Rate"
            value={`${statistics.occupancyRate}%`}
            valueIconClass="fa-regular fa-chart-line"
            dateRange="From Jan 01, 2025 - April 30, 2025"
            dateRangeColor="#6c757d"
            dateRangeBg="#f8f9fa"
            animate={animateStats}
          />
        </div>

        <div className={styles.reservationListSection}>
          <div className={styles.listHeader}>
            <h2 className={styles.listTitle}>
              {isLoading ? "Loading Reservations..." : "Reservation List"}
            </h2>
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
                  <button 
                    className={styles.filterButton}
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <i className="fa-regular fa-filter"></i>
                    <span className={styles.tooltipText}>Filter</span>
                  </button>
                </div>
              </div>
              <div className={styles.exportAction}>
                <div className={styles.iconTooltipWrapper}>
                  <button 
                    className={styles.exportButton}
                    onClick={() => setIsExportOpen(true)}>
                    <i className="fa-regular fa-file-export"></i>
                    <span className={styles.tooltipText}>Export</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <p>Fetching reservation data...</p>
              <div className={styles.spinner}></div>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <p>Error: {error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className={styles.retryButton}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className={`${styles.tableContainer} ${animateTable ? styles.tableFadeIn : ""}`}>
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
                    <th>Type</th>
                    <th>Audited By</th>
                  </tr>
                </thead>
                <tbody>{tableBodyContent}</tbody>
              </table>
            </div>
          )}
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

      {/* Add the NewReservationOverlay component */}
      <NewReservationOverlay
        isOpen={isNewReservationOpen}
        onClose={() => setIsNewReservationOpen(false)}
        onSubmit={handleNewReservation}
        availableRooms={availableRooms}
      />
      <FilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={filterOptions}
        roomOptions={roomOptions}
      />
      
      {/* Add the Export Overlay */}
      <ExportOverlay
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={(data) => console.log('Export data:', data)}
      />
      <ReservationDetailsOverlay
        isOpen={selectedReservation !== null}
        onClose={() => setSelectedReservation(null)}
        reservation={selectedReservation}
        customerLookup={customerLookup}
        roomLookup={roomLookup}
        staffLookup={staffLookup}
      />
    </div>
  );
};

export default Reservations;
