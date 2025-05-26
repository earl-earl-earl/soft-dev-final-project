// ReservationTable.tsx

import React, { useMemo, useCallback } from "react";
import styles from "../../../components/component_styles/Reservations.module.css"; 
import { 
  ReservationItem, 
  CustomerLookup, 
  RoomLookup, 
  StaffLookup,
  StatusValue 
} from "../../../src/types/reservation";
import { formatDateForDisplay as formatDateUtil } from "../../../src/utils/dateUtils"; 
import { getStatusDisplay, getStatusCategory, statusDescriptions } from "../../../src/utils/reservationUtils"; 

interface ReservationTableProps {
  reservations: ReservationItem[];
  customerLookup: CustomerLookup;
  roomLookup: RoomLookup;
  staffLookup: StaffLookup;
  onRowClick: (reservation: ReservationItem) => void;
  onStatusChange: (reservationId: string, newStatus: StatusValue) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  animate: boolean;
  viewedReservations: Set<string>; // Add viewedReservations to props
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
  animate,
  viewedReservations // Destructure viewedReservations
}) => {
  const safeCapitalize = useCallback((text: string | undefined): string => {
    if (!text) return "N/A"; 
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }, []);

  const formatDateForDisplay = useCallback((date?: Date | string): string => {
    return formatDateUtil(date); 
  }, []);

  const getCurrentStatusDisplay = useCallback((status: StatusValue | string): string => {
    return getStatusDisplay(status);
  }, []);
  
  const numberOfTableColumns = 18; 

  // --- HELPER FUNCTION FOR PAYMENT STATUS DISPLAY BASED ON RESERVATION STATUS ---
  const getPaymentStatusDisplayAndClass = useCallback((reservationStatus: StatusValue): { text: string; className: string } => {
    switch (reservationStatus) {
      case "Pending":
        return { text: "Payment Pending", className: styles.paymentPending };
      case "Confirmed_Pending_Payment":
        return { text: "Awaiting Downpayment", className: styles.paymentAwaitingDownpayment };
      case "Accepted":
        return { text: "Downpayment Paid", className: styles.paymentDownpaymentPaid };
      case "Checked_In":
      case "Checked_Out":
        return { text: "Fully Paid", className: styles.paymentFullyPaid };
      case "No_Show":
        // Based on rule: "if the reservation reached Accepted, it implies the downpayment was already confirmed."
        // This assumes a No_Show can only happen after an Accepted state where DP was made.
        return { text: "Downpayment Paid", className: styles.paymentDownpaymentPaid }; 
      case "Expired":
        return { text: "Not Applicable", className: styles.paymentNotApplicable };
      case "Cancelled":
        // Based on rule: "customer voluntarily cancelled ... while it was still in Pending status."
        return { text: "Not Applicable", className: styles.paymentNotApplicable };
      case "Rejected":
        return { text: "Rejected – No Payment Recorded", className: styles.paymentRejectedNoPayment };
      default:
        // Fallback for any unknown status or if item.status is somehow not a StatusValue
        // This shouldn't happen if types are correct.
        const exhaustiveCheck: never = reservationStatus;
        console.warn("getPaymentStatusDisplay: Unknown reservation status:", exhaustiveCheck);
        return { text: "N/A", className: styles.paymentNotPaid };
    }
  }, []);
  // --- END HELPER FUNCTION ---

  const tableBodyContent = useMemo(() => {
    if (isLoading) {
      return (
        <tr><td colSpan={numberOfTableColumns} className={styles.noReservationsCell}>Loading reservations...</td></tr>
      );
    }
    if (error && (!reservations || reservations.length === 0)) { 
      return (
        <tr><td colSpan={numberOfTableColumns} className={styles.noReservationsCell}>Error loading data: {error}. Please try retrying.</td></tr>
      );
    }
    if (!reservations || reservations.length === 0) {
      return (
        <tr><td colSpan={numberOfTableColumns} className={styles.noReservationsCell}>No reservations found.</td></tr>
      );
    }
    
    return reservations.map((item) => {
      if (!item || typeof item.id === 'undefined' || item.id === null) {
        console.warn("ReservationTable: Skipping rendering of an invalid or incomplete reservation item.", item);
        return null;
      }

      const currentItemStatus = item.status as StatusValue;
      const statusCategory = getStatusCategory(currentItemStatus);
      const totalGuests = (item.guests?.adults || 0) + (item.guests?.children || 0) + (item.guests?.seniors || 0);
      const nights = item.numberOfNights || 0; 

      let roomNameDisplay = "N/A";
      let roomPriceDisplay = "N/A";
      if (item.roomId) {
        const roomIdKey = String(item.roomId);
        const roomDetailsFromLookup = roomLookup[roomIdKey];
        if (roomDetailsFromLookup) {
          roomNameDisplay = roomDetailsFromLookup.name || `Room ID: ${roomIdKey}`;
          if (roomDetailsFromLookup.price != null && !isNaN(Number(roomDetailsFromLookup.price))) {
            roomPriceDisplay = `\u20B1${Number(roomDetailsFromLookup.price).toFixed(2)}`;
          }
        } else {
          roomNameDisplay = `Room ID: ${roomIdKey} (Info N/A)`;
        }
      } else {
        roomNameDisplay = "No Room Assigned";
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const getAllowedStaffTransitions = (status: StatusValue, source: string): StatusValue[] => {
        const allowed: StatusValue[] = [];
        if (["Cancelled", "Expired", "Checked_Out", "Rejected", "No_Show"].includes(status)) {
          return [status];
        }
        switch (status) {
          case "Pending": allowed.push("Confirmed_Pending_Payment", "Accepted", "Rejected"); break;
          case "Confirmed_Pending_Payment": allowed.push("Accepted", "Rejected"); break;
          case "Accepted": allowed.push("Checked_In", "No_Show"); break;
          case "Checked_In": allowed.push("Checked_Out", "No_Show"); break;
          default: console.warn(`getAllowedStaffTransitions: Unhandled status for generating transitions: ${status}`); break;
        }
        if (!allowed.includes(status)) allowed.unshift(status);
        return [...new Set(allowed)];
      };
      const staffSelectableNextStatuses = getAllowedStaffTransitions(currentItemStatus, item.source);

      // Get the derived payment status display information using the new helper
      const paymentDisplay = getPaymentStatusDisplayAndClass(currentItemStatus);

      return (
        <tr key={item.id} onClick={() => onRowClick(item)} className={styles.clickableRow}>
          <td>
            {!viewedReservations.has(item.id) && <span className={styles.newIndicator} />}
            {formatDateForDisplay(item.timestamp)}
          </td>
          <td>{item.customerId && customerLookup[String(item.customerId)]?.name || "N/A"}</td>
          <td>{roomNameDisplay}</td>
          <td>{formatDateForDisplay(item.checkIn)}</td>
          <td>{formatDateForDisplay(item.checkOut)}</td>
          <td>{nights}</td>
          <td>{item.customerId && customerLookup[String(item.customerId)]?.phone || "N/A"}</td>
          <td>{item.guests?.adults || 0}</td>
          <td>{item.guests?.children || 0}</td>
          <td>{item.guests?.seniors || 0}</td>
          <td><strong>{totalGuests}</strong></td>
          <td>{roomPriceDisplay}</td>
          <td>{item.totalPrice != null ? `\u20B1${item.totalPrice.toFixed(2)}` : "N/A"}</td>
          <td>
            <select
              className={`${styles.statusDropdown} ${styles[`status${statusCategory}`]}`}
              value={item.status} // This is StatusValue
              onChange={(e) => onStatusChange(item.id, e.target.value as StatusValue)}
              onClick={(e) => e.stopPropagation()}
              title={statusDescriptions[item.status as keyof typeof statusDescriptions] || getCurrentStatusDisplay(item.status)}
              disabled={staffSelectableNextStatuses.length <= 1 && (["Cancelled", "Expired", "Checked_Out", "Rejected", "No_Show"].includes(item.status as StatusValue))}
            >
              <option value={item.status}>{getCurrentStatusDisplay(item.status)}</option>
              {staffSelectableNextStatuses
                .filter(status => status !== item.status)
                .map(statusValue => (
                  <option key={statusValue} value={statusValue}>{getCurrentStatusDisplay(statusValue)}</option>
              ))}
            </select>
          </td>
          <td>{formatDateForDisplay(item.confirmationTime)}</td>
          {/* UPDATED PAYMENT DISPLAY CELL - Uses the new getPaymentStatusDisplayAndClass helper */}
          <td>
            <span className={`${styles.statusPillGeneral} ${paymentDisplay.className}`}>
              {paymentDisplay.text}
            </span>
          </td>
          <td><span className={`${styles.statusPillGeneral} ${(item.type || "direct") === "online" ? styles.typeOnline : styles.typeDirect}`}>{safeCapitalize(item.type)}</span></td>
          <td>{item.auditedBy && staffLookup[String(item.auditedBy)] ? staffLookup[String(item.auditedBy)]?.name : (item.auditedBy || "N/A")}</td>
        </tr>
      );
    });
  }, [reservations, customerLookup, roomLookup, staffLookup, onRowClick, onStatusChange, isLoading, error, safeCapitalize, formatDateForDisplay, getCurrentStatusDisplay, getPaymentStatusDisplayAndClass, viewedReservations]); // Added viewedReservations

  return (
    <>
      {error && !isLoading ? (
        <div className={styles.errorContainer}><p>Error: {error}</p><button onClick={onRetry} className={styles.retryButton}>Retry</button></div>
      ) : (
        <div className={`${styles.tableContainer} ${animate ? styles.tableFadeIn : ""}`}>
          <table className={styles.reservationTable}>
            <thead>
              <tr>
                <th>Reserved On</th><th>Name</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th>Phone</th>
                <th>Adults</th><th>Children</th><th>Seniors</th><th>Total Guests</th><th>Room Rate/Night</th><th>Total Bill</th>
                <th>Status</th><th>Confirmation</th><th>Payment</th><th>Type</th><th>Audited By</th>
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