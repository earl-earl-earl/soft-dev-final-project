import React from 'react';
import { Room } from '../../../src/types/room';
import { formatDate, formatCurrency } from '../../../src/utils/roomUtils';
import styles from '../../component_styles/Rooms.module.css';

interface RoomCardProps {
  room: Room;
  onEdit: () => void;
  onToggleStatus: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onEdit, onToggleStatus }) => {
  return (
    <div className={`${styles.roomCard} ${!room.isActive ? styles.deactivated : ""}`}>
      <div className={styles.roomContent}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          <div className={styles.roomTitle}>
            <h3>
              {room.name}{" "}
              <span className={styles.roomNumber}>{room.roomNumber}</span>
            </h3>
            <p className={styles.lastUpdated}>Last Updated: {room.lastUpdated}</p>
          </div>

          <div className={styles.amenitiesSection}>
            <h4>Amenities</h4>
            <ul className={styles.amenitiesList}>
              {room.amenities.map((amenity, index) => (
                <li key={index}>
                  <i className="fa-regular fa-check"></i> {amenity}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.roomStatus}>
            <span
              className={`${styles.status} ${
                room.status === "Occupied" ? styles.occupied : styles.vacant
              }`}
            >
              {room.status}
            </span>
            {room.status === "Occupied" && room.reservation && (
              <span className={styles.dateSpan}>
                &nbsp;• {formatDate(room.reservation.checkIn)} - {formatDate(room.reservation.checkOut)}
              </span>
            )}
            {room.status === "Vacant" && (
              <span className={styles.dateSpan}>
                &nbsp;• Available
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
                {formatCurrency(room.price)}
              </span>
            </div>
          </div>

          <div className={styles.roomActions}>
            <button className={styles.editButton} onClick={onEdit}>
              <i className="fa-regular fa-pencil"></i>
              <span className={styles.tooltipText}>Edit</span>
            </button>
            <button className={styles.deactivateButton} onClick={onToggleStatus}>
              <i className={`fa-regular ${room.isActive ? "fa-circle-minus" : "fa-circle-plus"}`}></i>
              <span className={styles.tooltipText}>
                {room.isActive ? "Deactivate" : "Activate"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;