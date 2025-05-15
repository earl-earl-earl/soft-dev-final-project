import React, { useEffect } from 'react';
import styles from '../component_styles/ReservationDetailsOverlay.module.css';
import { ReservationItem } from '../base_components/Reservations';

interface ReservationDetailsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationItem | null;
  customerLookup: Record<string, { name: string; phone: string }>;
  roomLookup: Record<string, { name: string }>;
  staffLookup: Record<string, string>;
}

const formatDateForDisplay = (date: Date | undefined): string => {
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
      // Set overflow to hidden when overlay opens
      document.body.style.overflow = 'hidden';
    } else {
      // Restore normal scrolling when overlay closes
      document.body.style.overflow = '';
    }
    
    // Cleanup function - make sure scrolling is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !reservation) return null;

  const customerDetails = customerLookup[reservation.customerId] || { name: 'N/A', phone: 'N/A' };
  const roomDetails = roomLookup[reservation.roomId] || { name: 'N/A' };
  const staffName = reservation.auditedBy ? staffLookup[reservation.auditedBy] || reservation.auditedBy : 'N/A';
  const totalGuests = reservation.guests.adults + reservation.guests.children + reservation.guests.seniors;
  
  return (
    <div className={styles.overlayContainer}>
      <div className={styles.overlayContent} style={{ maxWidth: '800px' }}>
        <div className={styles.overlayHeader}>
          <h2>Reservation Details</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-xmark"></i>
          </button>
        </div>
        
        <div className={styles.detailsContainer}>
          <div className={styles.detailsHeader}>
            <div>
              <span className={styles.reservationId}>{reservation.id}</span>
              <span className={`${styles.statusBadge} ${styles[`status${reservation.status}`]}`}>
                {reservation.status.replace('_', ' ')}
              </span>
              <span className={`${styles.typeBadge} ${styles[`type${reservation.type === 'online' ? 'Online' : 'Direct'}`]}`}>
                {reservation.type === 'online' ? 'Online' : 'Direct'}
              </span>
            </div>
            <div className={styles.dateInfo}>
              Created: {reservation.confirmationTime ? formatDateForDisplay(reservation.confirmationTime) : 'N/A'}
            </div>
          </div>
          
          <div className={styles.detailsGrid}>
            <div className={styles.detailsSection}>
              <h3>Customer Information</h3>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Name:</span>
                <span className={styles.detailValue}>{customerDetails.name}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Customer ID:</span>
                <span className={styles.detailValue}>{reservation.customerId}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone:</span>
                <span className={styles.detailValue}>{customerDetails.phone}</span>
              </div>
            </div>
            
            <div className={styles.detailsSection}>
              <h3>Reservation Information</h3>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Room:</span>
                <span className={styles.detailValue}>{roomDetails.name} ({reservation.roomId})</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Check-in:</span>
                <span className={styles.detailValue}>{formatDateForDisplay(reservation.checkIn)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Check-out:</span>
                <span className={styles.detailValue}>{formatDateForDisplay(reservation.checkOut)}</span>
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
                <span className={styles.detailValue}>{reservation.guests.adults}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Children:</span>
                <span className={styles.detailValue}>{reservation.guests.children}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Seniors:</span>
                <span className={styles.detailValue}>{reservation.guests.seniors}</span>
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
                <span className={styles.detailLabel}>Reservation Type:</span>
                <span className={styles.detailValue}>{reservation.type === 'online' ? 'Online' : 'Direct'}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.notesSection}>
            <h3>Notes</h3>
            <div className={styles.notesContent}>
              {reservation.notes ? (
                <p>{reservation.notes}</p>
              ) : (
                <p className={styles.emptyNotes}>No notes available for this reservation.</p>
              )}
            </div>
          </div>
          
          {/* Action buttons removed as requested */}
        </div>
      </div>
    </div>
  );
};

export default ReservationDetailsOverlay;