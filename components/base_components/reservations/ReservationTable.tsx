import React, { useMemo } from "react";
import styles from "../../../components/component_styles/Reservations.module.css";
import { 
  ReservationItem, 
  CustomerLookup, 
  RoomLookup, 
  StaffLookup 
} from "../../../src/types/reservation";
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
  const tableBodyContent = useMemo(() => {
    const hasActiveFilters = reservations.length === 0;

    if (isLoading) {
      return (
        <tr>
          <td colSpan={14} className={styles.noReservationsCell}>
            Loading reservations...
          </td>
        </tr>
      );
    }

    if (reservations.length === 0) {
      return (
        <tr>
          <td colSpan={14} className={styles.noReservationsCell}>
            {hasActiveFilters 
              ? "No results matching your search criteria." 
              : "No reservations found."}
          </td>
        </tr>
      );
    }
    
    return reservations.map((item) => {
      const statusCategory = getStatusCategory(item.status);
      const totalGuests = item.guests.adults + item.guests.children + item.guests.seniors;
      return (
        <tr 
          key={item.id} 
          onClick={() => onRowClick(item)}
          className={styles.clickableRow}
        >
          <td>{formatDateForDisplay(item.timestamp || new Date())}</td>
          <td>{customerLookup[item.customerId]?.name || "N/A"}</td>
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
              onChange={(e) => onStatusChange(item.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              title={statusDescriptions[statusCategory] || item.status}
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
          <td><span className={`${styles.statusPillGeneral} ${item.type === "online" ? styles.typeOnline : styles.typeDirect}`}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span></td>
          <td>{item.auditedBy ? staffLookup[item.auditedBy] || item.auditedBy : "N/A"}</td>
        </tr>
      );
    });
  }, [reservations, customerLookup, roomLookup, staffLookup, onRowClick, onStatusChange, isLoading]);

  return (
    <>
      {error ? (
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
    </>
  );
};

export default ReservationTable;