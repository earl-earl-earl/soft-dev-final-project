import React, { useState, useEffect } from 'react';
import { Room } from '../../../src/types/room';
import RoomCard from './RoomCard';
import styles from '../../component_styles/Rooms.module.css';

interface RoomGridProps {
  rooms: Room[];
  isSingleRow: boolean;
  page: number;
  searchTerm: string;
  onEdit: (roomId: string) => void;
  onToggleStatus: (roomId: string) => void;
}

const RoomGrid: React.FC<RoomGridProps> = ({
  rooms,
  isSingleRow,
  page,
  searchTerm,
  onEdit,
  onToggleStatus
}) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [page, searchTerm]);

  if (rooms.length === 0) {
    return (
      <div className={styles.noRoomsMessage}>
        <p>{searchTerm ? 'No rooms matching your search' : 'No rooms available'}</p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.roomsGrid} ${
        isSingleRow ? styles.singleRowGrid : ""
      } ${animate ? styles.fadeIn : ""}`}
      key={`${page}-${searchTerm}`}
    >
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onEdit={() => onEdit(room.id)}
          onToggleStatus={() => onToggleStatus(room.id)}
        />
      ))}
    </div>
  );
};

export default RoomGrid;