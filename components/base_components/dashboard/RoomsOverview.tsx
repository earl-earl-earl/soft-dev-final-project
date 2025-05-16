import React from 'react';
import styles from '../../../components/component_styles/Dashboard.module.css';
import { RoomStats, RoomData } from '../../../src/types/dashboard';
import SectionHeader from '../../../components/common/SectionHeader';
import StatsCard from '../../../components/common/StatCardDashboard';

interface RoomsOverviewProps {
  roomStats: RoomStats;
  recentRooms: RoomData[];
}

const RoomsOverview: React.FC<RoomsOverviewProps> = ({ roomStats, recentRooms }) => {
  return (
    <section className={styles.dashboardSection}>
      <SectionHeader 
        title="Rooms Overview"
        linkHref="/rooms"
        linkText="See All Rooms"
      />
      
      <div className={styles.statsCards}>
        <StatsCard
          title="Total Rooms"
          value={roomStats.totalRooms}
          change={roomStats.totalRoomsChange}
          isPositive={roomStats.totalRoomsChange > 0}
        />
        
        <StatsCard
          title="Occupied"
          value={roomStats.occupied}
          change={roomStats.occupiedChange}
          isPositive={roomStats.occupiedChange > 0}
        />
        
        <StatsCard
          title="Available Rooms"
          value={roomStats.available}
          change={roomStats.availableChange}
          isPositive={roomStats.availableChange > 0}
        />
      </div>
      
      <div className={styles.quickRoomView}>
        {recentRooms.map((room) => (
          <div key={room.id} className={styles.roomCard}>
            <div className={styles.roomHeader}>
              <h3>{room.name}</h3>
              <div className={styles.roomCapacity}>
                <span>Capacity</span>
                <div className={styles.capacityValue}>{room.capacity}</div>
              </div>
            </div>
            <div className={styles.roomFooter}>
              <span className={`${styles.status} ${room.status === "Occupied" ? styles.occupied : styles.vacant}`}>
                {room.status}
              </span>
              {room.occupant && <span className={styles.occupantName}> {room.occupant.name}</span>}
              <div className={styles.roomPrice}>
                <span>PHP {room.price.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RoomsOverview;