// ReservationTable.tsx

import React, { useMemo } from "react";
import styles from "../../../components/component_styles/Reservations.module.css";
import { 
  ReservationItem, 
  CustomerLookup, 
  RoomLookup, 
  StaffLookup,
  StatusValue 
} from "../../../src/types/reservation";
import { formatDateForDisplay } from "../../../src/utils/dateUtils";
import { getStatusCategory, statusDescriptions } from "../../../src/utils/reservationUtils";

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
    if (!text) return "N/A";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };
  const numberOfTableColumns = 18;

  const tableBodyContent = useMemo(() => {
    // ... (isLoading, error, no reservations checks) ...
    
    return reservations.map((item) => {
      const statusCategory = getStatusCategory(item.status as StatusValue);
      const totalGuests = (item.guests?.adults || 0) + (item.guests?.children || 0) + (item.guests?.seniors || 0);
      const room = item.roomId ? roomLookup[item.roomId] : null;
      const nights = item.numberOfNights || 0; 

      const getCurrentStatusDisplay = (status: StatusValue) => status.replace(/_/g, " ");

      // Define allowed staff-selectable transitions based on current status.
      // "Cancelled" and "Expired" are NOT selectable by staff via this dropdown.
      const getAllowedStaffTransitions = (currentStatus: StatusValue, source: string): StatusValue[] => {
        const allowed: StatusValue[] = [];

        // If current status is one that staff do not change via this UI,
        // or is a "final" state for this workflow.
        if (
          currentStatus === "Cancelled" || 
          currentStatus === "Expired" || 
          currentStatus === "Checked_Out" ||
          currentStatus === "Rejected" || 
          currentStatus === "No_Show"     
        ) {
          return [currentStatus]; // Only the current status is "allowed" (dropdown effectively read-only)
        }

        // Logic based on resort rules for staff actions:
        switch (currentStatus) {
          case "Pending": 
            // For online/mobile bookings. Staff can:
            // 1. Confirm it (pending payment)
            // 2. Accept it directly (if payment is somehow already handled or not required first)
            // 3. Reject it
            allowed.push("Confirmed_Pending_Payment", "Accepted", "Rejected");
            break;

          case "Confirmed_Pending_Payment": 
            // For direct bookings or online bookings that staff confirmed.
            // Staff can:
            // 1. Mark as "Accepted" (once payment is confirmed).
            // 2. "Reject" if payment fails / guest unresponsive.
            // "Checked_In" is NOT from here. It's from "Accepted".
            // "Cancelled" is NOT a staff option here.
            // "Expired" is system-driven.
            // "No_Show" is not from here; typically from "Accepted".
            allowed.push("Accepted", "Rejected");
            break;

          case "Accepted": 
            // Fully confirmed, payment received. Staff can:
            // 1. Check the guest In.
            // 2. Mark as "No_Show" if the guest doesn't arrive.
            // "Cancelled" is NOT a staff option here.
            allowed.push("Checked_In", "No_Show");
            break;

          case "Checked_In":
            // Guest is currently at the property. Staff can:
            // 1. Check the guest Out.
            // 2. Mark as "No_Show" (e.g. guest leaves mid-stay without notice - less common, but possible).
            allowed.push("Checked_Out", "No_Show");
            break;
          
          default:
            console.warn(`getAllowedStaffTransitions: Unhandled current status for transitions: ${currentStatus}`);
            break;
        }
        
        // Ensure the current status is always an option, even if no other transitions are valid from it.
        if (!allowed.includes(currentStatus)) {
             allowed.unshift(currentStatus);
        }
        return [...new Set(allowed)]; // Remove duplicates
      };

      const staffSelectableNextStatuses = getAllowedStaffTransitions(item.status as StatusValue, item.source);

      return (
        <tr 
          key={item.id} 
          onClick={() => onRowClick(item)}
          className={styles.clickableRow}
        >
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
          <td>{item.totalPrice != null ? `\u20B1${item.totalPrice.toFixed(2)}` : "N/A"}</td>
          <td>
            <select
              className={`${styles.statusDropdown} ${styles[`status${statusCategory}`]}`}
              value={item.status}
              onChange={(e) => onStatusChange(item.id, e.target.value as StatusValue)}
              onClick={(e) => e.stopPropagation()}
              title={statusDescriptions[item.status as keyof typeof statusDescriptions] || getCurrentStatusDisplay(item.status as StatusValue)}
              disabled={staffSelectableNextStatuses.length <= 1 && 
                         (item.status === "Cancelled" || 
                          item.status === "Expired" || 
                          item.status === "Checked_Out" ||
                          item.status === "Rejected" ||
                          item.status === "No_Show")}
            >
              <option value={item.status}>
                {getCurrentStatusDisplay(item.status as StatusValue)}
              </option>
              {staffSelectableNextStatuses
                .filter(status => status !== item.status)
                .map(statusValue => (
                  <option key={statusValue} value={statusValue}>
                    {getCurrentStatusDisplay(statusValue)}
                  </option>
              ))}
            </select>
          </td>
          <td>{item.confirmationTime ? formatDateForDisplay(item.confirmationTime) : "N/A"}</td>
          <td><span className={`${styles.statusPillGeneral} ${item.paymentReceived ? styles.paymentPaid : styles.paymentNotPaid}`}>{item.paymentReceived ? "Paid" : "Not Paid"}</span></td>
          <td><span className={`${styles.statusPillGeneral} ${(item.type || "direct") === "online" ? styles.typeOnline : styles.typeDirect}`}>{safeCapitalize(item.type)}</span></td>
          <td>{item.auditedBy && staffLookup[item.auditedBy] ? staffLookup[item.auditedBy]?.name : (item.auditedBy || "N/A")}</td>
        </tr>
      );
    });
  }, [reservations, customerLookup, roomLookup, staffLookup, onRowClick, onStatusChange, isLoading, error]);

  // ... (return statement for the table structure)
  return (
    <>
      {error && !isLoading ? (
        <div className={styles.errorContainer}>
          <p>Error: {error}</p>
          <button onClick={onRetry} className={styles.retryButton}>Retry</button>
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