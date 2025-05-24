import React, { useState } from 'react';
import { Room, Reservation } from '../../../src/types/room';
import { formatDate, formatCurrency } from '../../../src/utils/roomUtils';
import styles from '../../component_styles/Rooms.module.css';
import Portal from '../Portal';

interface RoomCardProps {
  room: Room;
  reservations: Reservation[];
  onEdit: () => void;
  onToggleStatus: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, reservations, onEdit, onToggleStatus }) => {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllBookingsOverlay, setShowAllBookingsOverlay] = useState(false);

  const displayedAmenities = room.amenities ? room.amenities.slice(0, 3) : [];
  const hasMoreAmenities = room.amenities ? room.amenities.length > 3 : false;
  
  const lastUpdatedDisplay = room.last_updated ? formatDate(new Date(room.last_updated)) : 'N/A';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentOccupation = reservations.find(res => {
    const checkInDate = new Date(res.checkIn); checkInDate.setHours(0,0,0,0);
    const checkOutDate = new Date(res.checkOut); checkOutDate.setHours(0,0,0,0);
    return checkInDate <= today && today < checkOutDate;
  });
  const isCurrentlyOccupied = !!currentOccupation;

  let displayStatusText: string;
  let statusDetailText: string | null = null;
  let statusBadgeClass: string = styles.vacant;

  if (!room.isActive) {
    displayStatusText = "Inactive";
    statusBadgeClass = styles.inactiveStatus;
    statusDetailText = "Room is not active";
  } else if (isCurrentlyOccupied && currentOccupation) {
    displayStatusText = "Occupied";
    statusBadgeClass = styles.occupied;
    statusDetailText = `Until ${formatDate(new Date(currentOccupation.checkOut))}`;
  } else { 
    displayStatusText = "Available";
    statusBadgeClass = styles.vacant;
  }

  const allRelevantReservations = reservations
    .filter(res => new Date(res.checkOut) > today)
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

  const initialBookingsInCardCount = 1; 
  const summaryBookings = allRelevantReservations.slice(0, initialBookingsInCardCount);
  // condition to show the "View all" link if there are more bookings than shown in summary
  const showViewAllBookingsLink = allRelevantReservations.length > initialBookingsInCardCount;


  return (
    <div className={`${styles.roomCard} ${!room.isActive ? styles.deactivated : ""}`}>
      <div className={styles.roomContent}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          <div className={styles.roomTitle}>
            <h3>{room.name}</h3>
            <p className={styles.lastUpdated}>Last Updated: {lastUpdatedDisplay}</p>
          </div>

          <div className={styles.amenitiesSection}>
            <h4>Amenities</h4>
            <ul className={styles.amenitiesList}>
              {displayedAmenities.map((amenity, index) => (
                <li key={index}><i className="fa-regular fa-check"></i> {amenity}</li>
              ))}
              {hasMoreAmenities && room.amenities && (
                <li className={styles.seeMoreLink} onClick={() => setShowAllAmenities(true)}>
                  <i className="fa-regular fa-ellipsis"></i> See {room.amenities.length - 3} more
                </li>
              )}
            </ul>
          </div>

          <div className={styles.roomStatusSection}>
            <h4>Current Status</h4>
            <div className={styles.statusDisplay}>
              <span className={`${styles.status} ${statusBadgeClass}`}>
                {displayStatusText}
              </span>
              {statusDetailText && (
                 <span className={styles.dateSpan}>
                    • {statusDetailText}
                 </span>
              )}
            </div>

            {/* Booking Information Summary in Card */}
            {room.isActive && ( // Only show booking info if room is active
              <div className={styles.bookingInfoSection}>
                {allRelevantReservations.length > 0 ? (
                  <>
                    <h5>
                      {/* Adjust heading based on whether the summary booking is the current one */}
                      {summaryBookings.length > 0 && summaryBookings[0] === currentOccupation 
                        ? "Current Booking:" 
                        : (summaryBookings.length > 0 ? "Next Booking:" : "Upcoming Bookings:")}
                    </h5>
                    {summaryBookings.map((res, index) => (
                      <div key={`${res.checkIn.toISOString()}-${index}-summary`} className={styles.reservationItem}>
                         <i className="fa-regular fa-calendar-days"></i> {formatDate(new Date(res.checkIn))} - {formatDate(new Date(res.checkOut))}
                         {res.guestName && res.guestName !== 'N/A' && <span className={styles.guestName}> ({res.guestName})</span>}
                      </div>
                    ))}
                    {/* VVVVVV MODIFIED CONDITION TO SHOW LINK VVVVVV */}
                    {showViewAllBookingsLink && ( 
                        <div 
                            className={styles.viewAllBookingsLink} 
                            onClick={() => setShowAllBookingsOverlay(true)}
                            role="button" 
                            tabIndex={0}  
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowAllBookingsOverlay(true);}}
                        >
                            View all {allRelevantReservations.length} booking{allRelevantReservations.length > 1 ? 's' : ''} 
                            <i className={`fa-solid fa-angle-right ${styles.viewAllIcon}`}></i>
                        </div>
                    )}
                    {/* ^^^^^^ MODIFIED CONDITION TO SHOW LINK ^^^^^^ */}
                  </>
                ) : (
                  <p className={styles.noBookings}>No upcoming bookings.</p>
                )}
              </div>
            )}
             {!room.isActive && (
                 <p className={styles.noBookings}>Room is currently inactive.</p>
            )}
          </div>
        </div>

        {/* Right Column (Capacity, Price, Actions) */}
        <div className={styles.rightColumn}>
          <div className={styles.roomCapacity}>
            <span>Capacity</span>
            <div className={styles.capacityValue}>{room.capacity}</div>
          </div>
          <div className={styles.priceSection}>
            <div className={styles.roomPrice}>
              <span className={styles.currency}>PHP </span>
              <span className={styles.priceValue}>{formatCurrency(room.room_price || 0)}</span>
            </div>
          </div>
          <div className={styles.roomActions}>
            <button className={styles.editButton} onClick={onEdit}>
              <i className="fa-regular fa-pencil"></i><span className={styles.tooltipText}>Edit</span>
            </button>
            <button className={styles.deactivateButton} onClick={onToggleStatus}>
              <i className={`fa-regular ${room.isActive ? "fa-circle-minus" : "fa-circle-plus"}`}></i>
              <span className={styles.tooltipText}>{room.isActive ? "Deactivate" : "Activate"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Amenities Popup */}
      {showAllAmenities && room.amenities && (
        <Portal>
          <div className={styles.amenitiesPopupOverlay} onClick={() => setShowAllAmenities(false)}>
            <div className={styles.amenitiesPopup} onClick={(e) => e.stopPropagation()}>
              <div className={styles.amenitiesPopupHeader}>
                <h3>All Amenities for {room.name}</h3>
                <button className={styles.closeButton} onClick={() => setShowAllAmenities(false)}>
                  <i className="fa-regular fa-xmark"></i>
                </button>
              </div>
              <ul className={styles.amenitiesPopupList}>
                {room.amenities.map((amenity, index) => (
                  <li key={index}><i className="fa-regular fa-check"></i> {amenity}</li>
                ))}
              </ul>
            </div>
          </div>
        </Portal>
      )}

      {/* Bookings Overlay/Popup */}
      {showAllBookingsOverlay && (
        <Portal>
          <div className={styles.bookingsPopupOverlay} onClick={() => setShowAllBookingsOverlay(false)}>
            <div className={styles.bookingsPopup} onClick={(e) => e.stopPropagation()}>
              <div className={styles.bookingsPopupHeader}>
                <h3>Bookings for {room.name}</h3>
                <button className={styles.closeButton} onClick={() => setShowAllBookingsOverlay(false)}>
                  <i className="fa-regular fa-xmark"></i>
                </button>
              </div>
              {allRelevantReservations.length > 0 ? (
                <ul className={styles.bookingsPopupList}>
                  {allRelevantReservations.map((res, index) => (
                    <li key={`${res.checkIn.toISOString()}-${index}-popup`} className={styles.bookingPopupItem}>
                      <div className={styles.bookingDetailLine}>
                        <i className="fa-solid fa-calendar-alt"></i>
                        <strong>Dates:</strong> {formatDate(new Date(res.checkIn))} - {formatDate(new Date(res.checkOut))}
                      </div>
                      {res.guestName && res.guestName !== 'N/A' && (
                        <div className={styles.bookingDetailLine}>
                          <i className="fa-solid fa-user"></i>
                          <strong>Guest:</strong> {res.guestName}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noBookingsInPopup}>No upcoming or ongoing bookings.</p>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default RoomCard;