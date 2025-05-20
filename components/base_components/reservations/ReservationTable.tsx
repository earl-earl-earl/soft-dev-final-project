import React, { useMemo } from "react";
import styles from "../../../components/component_styles/Reservations.module.css";
import { 
  ReservationItem, 
  CustomerLookup, 
  RoomLookup, 
  StaffLookup 
} from "../../../src/types/reservation"; // VERIFY: Path and ensure ReservationItem.timestamp can be Date | undefined
import { formatDateForDisplay } from "../../../src/utils/dateUtils";
import { getStatusCategory, statusDescriptions } from "../../../src/utils/reservationUtils";

interface ReservationTableProps {
  reservations: ReservationItem[];
  customerLookup: CustomerLookup;
  roomLookup: RoomLookup;
  staffLookup: StaffLookup;
  onRowClick: (reservation: ReservationItem) => void;
  onStatusChange: (reservationId: string, newStatus: string) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  animate: boolean;
}

const ReservationTable: React.FC<ReservationTableProps> = ({
  reservations,
  customerLookup,
  roomLookup,
  staffLookup,
  onRowClick,
  onStatusChange,
  isLoading,
  error,
  onRetry,
  animate
}) => {
  const safeCapitalize = (text: string | undefined): string => {
    if (!text) return "Direct"; // Default type display
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Determine the number of columns for colSpan
  // Based on your thead, there are 18 columns.
  const numberOfTableColumns = 18;

  const tableBodyContent = useMemo(() => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={numberOfTableColumns} className={styles.noReservationsCell}>
            Loading reservations...
          </td>
        </tr>
      );
    }

    // Error prop is passed, so we can display it here directly if needed,
    // though the main error display is outside the table in the return.
    // This specific check might be redundant if error is handled globally for the table.
    if (error && reservations.length === 0) { 
      return (
        <tr>
          <td colSpan={numberOfTableColumns} className={styles.noReservationsCell}>
            Error loading data. Please try retrying.
          </td>
        </tr>
      );
    }

    if (reservations.length === 0) {
      return (
        <tr>
          <td colSpan={numberOfTableColumns} className={styles.noReservationsCell}>
            No reservations found.
          </td>
        </tr>
      );
    }
    
    return reservations.map((item) => {
      const statusCategory = getStatusCategory(item.status);
      const totalGuests = (item.guests?.adults || 0) + (item.guests?.children || 0) + (item.guests?.seniors || 0);
      const room = roomLookup[item.roomId];

      const getAllowedStatuses = () => {
        // Your existing logic for allowed statuses
        const allPossibleStatuses = ["Pending", "Confirmed_Pending_Payment", "Accepted", "Checked_In", "Checked_Out", "Cancelled", "Rejected", "No_Show"];
        if (item.status === "Checked_Out") return ["Checked_Out"];
        if (item.status === "Cancelled") return ["Cancelled"];
        if (item.source === "staff_manual" && (item.status === "Pending" || item.status === "Confirmed_Pending_Payment")) {
          return ["Pending", "Confirmed_Pending_Payment", "Accepted", "Cancelled"];
        } else if (item.source === "mobile_app" && item.status === "Pending") { 
          return ["Pending", "Confirmed_Pending_Payment", "Rejected", "Cancelled"];
        }
        return allPossibleStatuses.filter(s => s !== item.status);
      };

      const allowedStatuses = getAllowedStatuses();

      const nights = (() => {
        // Ensure dates are valid before calculation
        if (!item.checkIn || !item.checkOut) return 0;
        const checkIn = new Date(item.checkIn);
        const checkOut = new Date(item.checkOut);
        // Check if dates are valid after conversion
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return 0;

        const diffTime = checkOut.getTime() - checkIn.getTime();
        // Only calculate if checkout is after checkin
        if (diffTime <= 0) return 0; 
        // For hotel nights, typically use UTC to avoid timezone issues for date-only comparisons
        const start = new Date(Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate()));
        const end = new Date(Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate()));
        const utcDiffTime = end.getTime() - start.getTime();

        const diffDays = Math.round(utcDiffTime / (1000 * 60 * 60 * 24)); // Or Math.ceil for typical hotel night counting
        return diffDays > 0 ? diffDays : 0;
      })();

      return (
        <tr 
          key={item.id} 
          onClick={() => onRowClick(item)}
          className={styles.clickableRow}
        >
          {/* MODIFIED HERE: Pass item.timestamp directly */}
          <td>{formatDateForDisplay(item.timestamp)}</td>
          <td>{customerLookup[item.customerId]?.name || "N/A"}</td>
          <td>{room?.name || item.roomId}</td>
          <td>{formatDateForDisplay(item.checkIn)}</td>
          <td>{formatDateForDisplay(item.checkOut)}</td>
          <td>{nights}</td>
          <td>{customerLookup[item.customerId]?.phone || "N/A"}</td>
          <td>{item.guests?.adults || 0}</td>
          <td>{item.guests?.children || 0}</td>
          <td>{item.guests?.seniors || 0}</td>
          <td><strong>{totalGuests}</strong></td>
          <td>{room?.price != null ? `\u20B1${room.price.toFixed(2)}` : "N/A"}</td>
          <td>
            {item.totalPrice != null ? `\u20B1${item.totalPrice.toFixed(2)}` : "N/A"}
          </td>
          <td>
            <select
              className={`${styles.statusDropdown} ${styles[`status${statusCategory}`]}`}
              value={item.status}
              onChange={(e) => onStatusChange(item.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              title={statusDescriptions[statusCategory] || item.status}
            >
              <option value={item.status} disabled={!allowedStatuses.includes(item.status) && allowedStatuses.length > 0}>
                {item.status.replace(/_/g, " ")}
              </option>
              {statusDescriptions && Object.keys(statusDescriptions)
                .filter(s => s !== item.status && allowedStatuses.includes(s)) 
                .map(statusKey => (
                  <option key={statusKey} value={statusKey}>
                    {statusKey.replace(/_/g, " ")}
                  </option>
              ))}
            </select>
          </td>
          <td>{item.confirmationTime ? formatDateForDisplay(item.confirmationTime) : "N/A"}</td>
          <td>
            <span className={`${styles.statusPillGeneral} ${item.paymentReceived ? styles.paymentPaid : styles.paymentNotPaid}`}>
              {item.paymentReceived ? "Paid" : "Not Paid"}
            </span>
          </td>
          <td>
            <span className={`${styles.statusPillGeneral} ${(item.type || "direct") === "online" ? styles.typeOnline : styles.typeDirect}`}>
              {safeCapitalize(item.type)}
            </span>
          </td>
          <td>{item.auditedBy ? staffLookup[item.auditedBy]?.name || item.auditedBy : "N/A"}</td>
        </tr>
      );
    });
  }, [reservations, customerLookup, roomLookup, staffLookup, onRowClick, onStatusChange, isLoading, error]);

  return (
    <>
      {error && !isLoading ? (
        <div className={styles.errorContainer}>
          <p>Error: {error}</p>
          <button 
            onClick={onRetry} 
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className={`${styles.tableContainer} ${animate ? styles.tableFadeIn : ""}`}>
          <table className={styles.reservationTable}>
            <thead>
              <tr>
                <th>Reserved On</th>
                <th>Name</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Nights</th>
                <th>Phone</th>
                <th>Adults</th>
                <th>Children</th>
                <th>Seniors</th>
                <th>Total Guests</th>
                <th>Room Rate/Night</th>
                <th>Total Bill</th>
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
    </>
  );
};

export default ReservationTable;