import React, { useState } from 'react';
import { Room } from '../../../src/types/room';
import { formatDate, formatCurrency } from '../../../src/utils/roomUtils';
import styles from '../../component_styles/Rooms.module.css';
import Portal from '../Portal';

interface RoomCardProps {
  room: Room;
  onEdit: () => void;
  onToggleStatus: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onEdit, onToggleStatus }) => {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  
  const displayedAmenities = room.amenities ? room.amenities.slice(0, 3) : [];
  const hasMoreAmenities = room.amenities ? room.amenities.length > 3 : false;
  
  // If room.last_updated is not guaranteed, provide a fallback or handle it
  const lastUpdatedDisplay = room.last_updated ? formatDate(new Date(room.last_updated)) : 'N/A';


  return (
    <div className={`${styles.roomCard} ${!room.isActive ? styles.deactivated : ""}`}>
      <div className={styles.roomContent}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          <div className={styles.roomTitle}>
            <h3>
              {room.name}
              {/* room.roomNumber was here - REMOVED */}
            </h3>
            <p className={styles.lastUpdated}>Last Updated: {lastUpdatedDisplay}</p>
          </div>

          <div className={styles.amenitiesSection}>
            <h4>Amenities</h4>
            <ul className={styles.amenitiesList}>
              {displayedAmenities.map((amenity, index) => (
                <li key={index}>
                  <i className="fa-regular fa-check"></i> {amenity}
                </li>
              ))}
              {hasMoreAmenities && (
                <li className={styles.seeMoreLink} onClick={() => setShowAllAmenities(true)}>
                  <i className="fa-regular fa-ellipsis"></i> See {room.amenities.length - 3} more
                </li>
              )}
            </ul>
          </div>

          <div className={styles.roomStatus}>
            <span
              className={`${styles.status} ${
                room.status === "Occupied" ? styles.occupied : styles.vacant
              }`}
            >
              {/* Ensure room.status is defined before using it */}
              {room.status === "Occupied" ? "Unavailable" : room.status || (room.is_active ? 'Available' : 'Inactive')}
            </span>

            {room.status === "Occupied" && room.reservation && (
              <span className={styles.dateSpan}>
                 • {formatDate(new Date(room.reservation.checkIn))} - {formatDate(new Date(room.reservation.checkOut))}
              </span>
            )}
            {room.status === "Vacant" && ( // Or simply if !room.status === "Occupied"
              <span className={styles.dateSpan}>
                 • Available
              </span>
            )}
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.roomCapacity}>
            <span>Capacity</span>
            <div className={styles.capacityValue}>{room.capacity}</div>
          </div>

          <div className={styles.priceSection}>
            <div className={styles.roomPrice}>
              <span className={styles.currency}>PHP </span>
              <span className={styles.priceValue}>
                {formatCurrency(
                  typeof room.room_price === "number"
                    ? room.room_price
                    : typeof room.price === "number"
                    ? room.price
                    : 0
                )} 
              </span>
            </div>
          </div>

          <div className={styles.roomActions}>
            <button className={styles.editButton} onClick={onEdit}>
              <i className="fa-regular fa-pencil"></i>
              <span className={styles.tooltipText}>Edit</span>
            </button>
            <button className={styles.deactivateButton} onClick={onToggleStatus}>
              <i className={`fa-regular ${room.is_active ? "fa-circle-minus" : "fa-circle-plus"}`}></i>
              <span className={styles.tooltipText}>
                {room.is_active ? "Deactivate" : "Activate"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Amenities Popup using Portal */}
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
                  <li key={index}>
                    <i className="fa-regular fa-check"></i> {amenity}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default RoomCard;