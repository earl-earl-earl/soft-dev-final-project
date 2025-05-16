import React, { useState, useEffect } from 'react';
import StatsCard from '../../common/StatsCardRooms';
import { RoomStats } from '../../../src/types/room';
import styles from '../../component_styles/Rooms.module.css';

interface RoomStatsProps {
  stats: RoomStats;
}

const RoomStatsSection: React.FC<RoomStatsProps> = ({ stats }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.statsContainer}>
      <StatsCard
        title="Total Rooms"
        value={stats.totalRooms}
        change={stats.totalRoomsChange}
        isPositive={stats.totalRoomsChange > 0}
        animate={animate}
      />
      <StatsCard
        title="Occupied"
        value={stats.occupied}
        change={stats.occupiedChange}
        isPositive={stats.occupiedChange > 0}
        animate={animate}
      />
      <StatsCard
        title="Available Rooms"
        value={stats.available}
        change={stats.availableChange}
        isPositive={stats.availableChange > 0}
        animate={animate}
      />
    </div>
  );
};

export default RoomStatsSection;