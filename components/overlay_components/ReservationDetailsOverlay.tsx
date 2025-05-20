// ReservationDetailsOverlay.tsx

import React, { useEffect } from 'react';
import styles from '../component_styles/ReservationDetailsOverlay.module.css'; // Ensure this path is correct

// Import ALL necessary types DIRECTLY from your main types/reservation.ts file
import { 
  ReservationItem, 
  CustomerLookup, // Use this directly
  RoomLookup,     // Use this directly
  StaffLookup     // Use this directly
} from '../../src/types/reservation'; // <<< ADJUST THIS PATH TO YOUR ACTUAL types/reservation.ts FILE

interface ReservationDetailsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationItem | null;
  // Use the imported lookup types directly for props
  customerLookup: CustomerLookup;
  roomLookup: RoomLookup;
  staffLookup: StaffLookup; 
}

const formatDateForDisplay = (date?: Date): string => {
  if (!date || isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    // hour: "2-digit", // Uncomment if you want time
    // minute: "2-digit", // Uncomment if you want time
  });
};

const ReservationDetailsOverlay: React.FC<ReservationDetailsOverlayProps> = ({
  isOpen,
  onClose,
  reservation,
  customerLookup,
  roomLookup,
  staffLookup,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !reservation) return null;

  // Now, these lookups will match the structure from your types/reservation.ts
  const customer = reservation.customerId ? customerLookup[reservation.customerId] : null;
  // customer will be: { customer_name_at_booking: string; name: string; phone: string; } | null

  const room = reservation.roomId ? roomLookup[reservation.roomId] : null;
  // room will be: { name: string; price?: number; } | null

  const staff = reservation.auditedBy ? staffLookup[reservation.auditedBy] : null;
  // staff will be: StaffDetails (i.e., { name: string; phone?: string; role?: string; }) | null

  const staffName = staff?.name || (reservation.auditedBy ? `ID: ${reservation.auditedBy}` : 'N/A');
  
  const totalGuests = (reservation.guests?.adults || 0) + 
                    (reservation.guests?.children || 0) + 
                    (reservation.guests?.seniors || 0);
  
  return (
    <div className={styles.overlayContainer} onClick={onClose}>
      <div className={styles.overlayContent} style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.overlayHeader}>
          <h2>Reservation Details</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-xmark"></i>
          </button>
        </div>
        
        <div className={styles.detailsContainer}>
          <div className={styles.detailsHeader}>
            <div>
              <span className={styles.reservationIdLabel}>ID: </span>
              <span className={styles.reservationIdValue}>{reservation.id}</span>
              <span className={`${styles.statusBadge} ${styles[`status${reservation.status?.replace(/\s+/g, '_')}`]}`}>
                {reservation.status?.replace(/_/g, ' ') || 'N/A'}
              </span>
              <span className={`${styles.typeBadge} ${styles[`type${reservation.type === 'online' ? 'Online' : 'Direct'}`]}`}>
                {reservation.type === 'online' ? 'Online' : 'Direct'}
              </span>
            </div>
            <div className={styles.dateInfo}>
              Reserved: {formatDateForDisplay(reservation.timestamp)}
            </div>
          </div>
          
          <div className={styles.detailsGrid}>
            <div className={styles.detailsSection}>
              <h3>Customer Information</h3>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Name:</span>
                {/* 'customer.name' from your CustomerLookup type */}
                <span className={styles.detailValue}>{customer?.name || (reservation.customerId ? `ID: ${reservation.customerId}` : 'N/A')}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone:</span>
                <span className={styles.detailValue}>{customer?.phone || 'N/A'}</span>
              </div>
              {/* Use customer_name_at_booking from your CustomerLookup type */}
              {customer?.customer_name_at_booking && customer.customer_name_at_booking !== customer.name && (
                 <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Name at Booking:</span>
                    <span className={styles.detailValue}>{customer.customer_name_at_booking}</span>
                </div>
              )}
            </div>
            
            <div className={styles.detailsSection}>
              <h3>Booking Information</h3>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Room:</span>
                <span className={styles.detailValue}>{room?.name || (reservation.roomId ? `ID: ${reservation.roomId}`: 'N/A')}</span>
              </div>
              {/* 'room.price' from your RoomLookup type */}
              {room?.price !== undefined && (
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Room Rate/Night:</span>
                    <span className={styles.detailValue}>{`\u20B1${room.price.toFixed(2)}`}</span>
                </div>
              )}
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Check-in:</span>
                <span className={styles.detailValue}>{formatDateForDisplay(reservation.checkIn)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Check-out:</span>
                <span className={styles.detailValue}>{formatDateForDisplay(reservation.checkOut)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Nights:</span>
                <span className={styles.detailValue}>{reservation.numberOfNights}</span>
              </div>
               <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Total Bill:</span>
                <span className={styles.detailValue}>
                  {reservation.totalPrice !== undefined ? `\u20B1${reservation.totalPrice.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Payment:</span>
                <span className={`${styles.detailValue} ${styles.paymentStatus} ${reservation.paymentReceived ? styles.paid : styles.unpaid}`}>
                  {reservation.paymentReceived ? 'Paid' : 'Not Paid'}
                </span>
              </div>
            </div>
            
            <div className={styles.detailsSection}>
              <h3>Guest Information</h3>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Adults:</span>
                <span className={styles.detailValue}>{reservation.guests?.adults || 0}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Children:</span>
                <span className={styles.detailValue}>{reservation.guests?.children || 0}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Seniors:</span>
                <span className={styles.detailValue}>{reservation.guests?.seniors || 0}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Total Guests:</span>
                <span className={styles.detailValue}><strong>{totalGuests}</strong></span>
              </div>
            </div>
            
            <div className={styles.detailsSection}>
              <h3>Administrative Information</h3>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Audited By:</span>
                <span className={styles.detailValue}>{staffName}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Source:</span>
                <span className={styles.detailValue}>{reservation.source?.replace(/_/g, ' ') || 'N/A'}</span>
              </div>
               <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Type (Display):</span>
                <span className={styles.detailValue}>{reservation.type === 'online' ? 'Online' : 'Direct'}</span>
              </div>
              {reservation.confirmationTime && (
                 <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Confirmed On:</span>
                    <span className={styles.detailValue}>{formatDateForDisplay(reservation.confirmationTime)}</span>
                </div>
              )}
            </div>
          </div>
          
          {reservation.notes && (
            <div className={styles.notesSection}>
              <h3>Notes</h3>
              <div className={styles.notesContent}>
                <p>{reservation.notes}</p>
              </div>
            </div>
          )}
          {!reservation.notes && (
             <div className={styles.notesSection}>
                <h3>Notes</h3>
                <p className={styles.emptyNotes}>No notes available for this reservation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationDetailsOverlay;