import React, { useState, useEffect } from 'react';
import { Room } from '../../../src/types/room';
import { ReservationLookup } from '../../../src/utils/fetchRooms';
import RoomCard from './RoomCard';
import styles from '../../component_styles/Rooms.module.css';

interface RoomGridProps {
  rooms: Room[];
  isSingleRow: boolean;
  page: number;
  searchTerm: string;
  onEdit: (roomId: string) => void;
  onToggleStatus: (roomId: string) => void;
  onDelete: (roomId: string) => void; // Add this
  isAdmin: boolean; // Add this
  reservationLookup: ReservationLookup;
}

const RoomGrid: React.FC<RoomGridProps> = ({
  rooms,
  isSingleRow,
  page,
  searchTerm,
  onEdit,
  onToggleStatus,
  onDelete, // Add this
  isAdmin, // Add this
  reservationLookup
}) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [page, searchTerm, rooms]);

  if (!rooms || rooms.length === 0) {
    return (
      <div className={styles.noRoomsMessage}>
        <p>{searchTerm ? 'No rooms matching your search' : 'No rooms available at the moment'}</p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.roomsGrid} ${
        isSingleRow ? styles.singleRowGrid : ""
      } ${animate ? styles.fadeIn : ""}`}
      key={`room-grid-${page}-${searchTerm}`}
    >
      {rooms.map((room) => {
        // Get reservations for the current room
        // fetchRooms.ts uses String(reservation.room_id) for lookup keys
        const roomSpecificReservations = reservationLookup[String(room.id)] || [];
        
        console.log(`RoomGrid: Room ID ${room.id}, Reservations found:`, roomSpecificReservations.length); // For debugging

        return (
          <RoomCard
            key={String(room.id)}
            room={room}
            reservations={roomSpecificReservations}
            onEdit={() => onEdit(String(room.id))}
            onToggleStatus={() => onToggleStatus(String(room.id))}
            onDelete={() => onDelete(String(room.id))} // Add this
            isAdmin={isAdmin} // Add this
          />
        );
      })}
    </div>
  );
};

export default RoomGrid;