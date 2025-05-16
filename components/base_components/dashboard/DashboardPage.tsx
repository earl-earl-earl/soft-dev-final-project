import React from 'react';
import styles from '../../../components/component_styles/Dashboard.module.css';
import { useAnimation } from '../../../src/hooks/useAnimation';
import { getMockDashboardData } from '../../../src/utils/dashboardData';

// Import dashboard sections
import RoomsOverview from './RoomsOverview';
import ReservationsOverview from './ReservationsOverview';
import StaffOverview from './StaffOverview';
import AdminOverview from './AdminOverview';

interface DashboardPageProps {
  role: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ role }) => {
  const animate = useAnimation();
  
  // In a real application, you would fetch this data from an API
  // For now, we'll use mock data
  const { 
    roomStats, 
    recentRooms, 
    reservationStats, 
    recentReservations,
    recentStaff,
    recentAdmins
  } = getMockDashboardData();

  const isAdmin = role === 'admin' || role === 'super_admin';

  return (
    <div className={`${styles.dashboardContainer} ${animate ? styles.fadeIn : ""}`}>
      <RoomsOverview 
        roomStats={roomStats}
        recentRooms={recentRooms}
      />
      
      <ReservationsOverview 
        reservationStats={reservationStats}
        recentReservations={recentReservations}
      />
      
      <div className={`${isAdmin ? styles.twoColumnSection : styles.fullWidthSection}`}>
        {/* Staff section - visible to all roles */}
        <StaffOverview staffData={recentStaff} />
        
        {/* Admin section - only visible to admin and super_admin */}
        {isAdmin && <AdminOverview adminData={recentAdmins} />}
      </div>
    </div>
  );
};

export default DashboardPage;