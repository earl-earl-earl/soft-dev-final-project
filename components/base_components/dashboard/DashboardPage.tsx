/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import styles from '../../../components/component_styles/Dashboard.module.css';
import { supabase } from '@/lib/supabaseClient';
import { useSessionContext } from '@/contexts/SessionContext';

// Import dashboard sections
import RoomsOverview from './RoomsOverview';
import ReservationsOverview from './ReservationsOverview';
import StaffOverview from './StaffOverview';
import AdminOverview from './AdminOverview';

// Import types
import { 
  RoomStats, 
  RoomData, 
  ReservationStats, 
  ReservationData,
  StaffData,
  AdminData
} from '../../../src/types/dashboard';

interface DashboardPageProps {
  role: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ role }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const { userId, role: userRole } = useSessionContext();
  
  // Animation states
  const [animate, setAnimate] = useState(false);
  const loadingFinishedRef = useRef(false);

  // Handle animation after loading
  useEffect(() => {
    if (!isLoading && !loadingFinishedRef.current) {
      loadingFinishedRef.current = true;
      
      // Small delay after loading finishes before starting animations
      setTimeout(() => {
        setAnimate(true);
      }, 100);
    }
  }, [isLoading]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch room statistics
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*');
          
        if (roomsError) throw new Error(`Error fetching rooms: ${roomsError.message}`);
        
        // Calculate room statistics
        const totalRooms = roomsData.length || 0;
        const occupiedRooms = roomsData.filter(room => room.status === 'Occupied').length || 0;
        const availableRooms = totalRooms - occupiedRooms;
        
        const roomStats: RoomStats = {
          totalRooms,
          totalRoomsChange: 0,
          occupied: occupiedRooms,
          occupiedChange: 0,
          available: availableRooms,
          availableChange: 0
        };
        
        // Get recent rooms with occupants
        const recentRooms: RoomData[] = roomsData.slice(0, 6).map(room => ({
          id: room.id,
          name: room.name || `Room ${room.id}`,
          capacity: room.capacity || 0,
          price: room.room_price || 0,
          status: room.status || 'Vacant',
          occupant: room.occupant_name ? { name: room.occupant_name } : undefined
        }));
        
        // Fetch reservation statistics
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*');
          
        if (reservationsError) throw new Error(`Error fetching reservations: ${reservationsError.message}`);
        
        // Calculate reservation statistics
        const today = new Date();
        const checkIns = reservationsData.filter(res => 
          new Date(res.check_in).toDateString() === today.toDateString()
        ).length;
        
        const checkOuts = reservationsData.filter(res => 
          new Date(res.check_out).toDateString() === today.toDateString()
        ).length;
        
        const totalGuests = reservationsData.reduce((sum, res) => 
          sum + (res.num_adults || 0) + (res.num_children || 0) + (res.num_seniors || 0), 0
        );
        
        const occupancyRate = totalRooms > 0 
          ? Math.round((occupiedRooms / totalRooms) * 100) 
          : 0;
          
        const reservationStats: ReservationStats = {
          checkIns: checkIns.toString(),
          checkOuts: checkOuts.toString(),
          totalGuests: totalGuests.toString(),
          occupancyRate: `${occupancyRate}%`
        };
        
        // Get recent reservations
        const { data: recentReservationsData, error: recentReservationsError } = await supabase
          .from('reservations')
          .select('id, customer_id, customer_name_at_booking, room_id, check_in, status')
          .order('check_in', { ascending: false })
          .limit(5);
          
        if (recentReservationsError) throw new Error(`Error fetching recent reservations: ${recentReservationsError.message}`);
        
        // Fetch room data for reservations
        const roomIds = recentReservationsData.map(res => res.room_id).filter(Boolean);
        const { data: reservationRoomsData } = await supabase
          .from('rooms')
          .select('id, name')
          .in('id', roomIds);
          
        const roomLookup: Record<number, string> = {};
        if (reservationRoomsData) {
          reservationRoomsData.forEach(room => {
            roomLookup[room.id] = room.name || `Room ${room.id}`;
          });
        }
        
        // Updated to use customer_name_at_booking
        const recentReservations: ReservationData[] = recentReservationsData.map(res => ({
          id: res.id,
          name: res.customer_name_at_booking || `Guest ${res.customer_id}`,
          room: roomLookup[res.room_id] || `Room ${res.room_id}`,
          checkIn: new Date(res.check_in).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          status: res.status?.replace(/_/g, ' ') || 'Processing'
        }));
        
        // Fetch staff data
        const { data: staffData, error: staffError } = await supabase
          .from('staff')
          .select('user_id, name, username, position')
          .limit(5);
          
        if (staffError) throw new Error(`Error fetching staff: ${staffError.message}`);
        
        const recentStaff: StaffData[] = staffData.map(staff => ({
          id: staff.user_id,
          username: staff.username || '',
          name: staff.name || 'Unknown',
          position: staff.position || 'Staff'
        }));
        
        // Only fetch admin data if user has appropriate permissions
        let recentAdmins: AdminData[] = [];
        
        if (userRole === 'admin' || userRole === 'super_admin') {
          const { data: adminData, error: adminError } = await supabase
            .from('users')
            .select('id, email, role')
            .in('role', ['admin', 'super_admin'])
            .limit(5);
            
          if (adminError) throw new Error(`Error fetching admins: ${adminError.message}`);
          
          // Get admin profiles from staff table
          const adminIds = adminData.map(admin => admin.id);
          const { data: adminProfiles } = await supabase
            .from('staff')
            .select('user_id, name, position')
            .in('user_id', adminIds);
            
          // Create lookup tables for staff data
          const staffLookup: Record<string, any> = {};
          if (adminProfiles) {
            adminProfiles.forEach(profile => {
              staffLookup[profile.user_id] = profile;
            });
          }
          
          // Combine data from users and staff tables
          recentAdmins = adminData.map(admin => {
            const staffProfile = staffLookup[admin.id];
            return {
              id: admin.id,
              username: admin.email?.split('@')[0] || `admin-${admin.id}`,
              name: staffProfile?.name || 'Unknown Admin',
              position: staffProfile?.position || 'Administrator'
            };
          });
        }
        
        // Combine all data
        setDashboardData({
          roomStats,
          recentRooms,
          reservationStats,
          recentReservations,
          recentStaff,
          recentAdmins
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [userRole, userId]);
  
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingAnimation}>
          <div className={styles.spinnerContainer}>
            <i className="fa-regular fa-spinner-third fa-spin"></i>
          </div>
          <div className={styles.loadingCards}>
            <div className={`${styles.loadingCard} ${styles.loadingCard1}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard2}`}></div>
            <div className={`${styles.loadingCard} ${styles.loadingCard3}`}></div>
          </div>
        </div>
        <h3 className={styles.loadingTitle}>Preparing Your Dashboard</h3>
        <p className={styles.loadingText}>Loading statistics and recent activity...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fa-regular fa-exclamation-circle"></i>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!dashboardData) {
    return null;
  }
  
  const { 
    roomStats, 
    recentRooms, 
    reservationStats, 
    recentReservations,
    recentStaff,
    recentAdmins
  } = dashboardData;

  return (
    <div className={`${styles.dashboardContainer} ${animate ? styles.fadeIn : ""}`}>
      <div className={`${styles.dashboardSection} ${animate ? styles.animateFirst : ""}`}>
        <RoomsOverview 
          roomStats={roomStats}
          recentRooms={recentRooms}
        />
      </div>
      
      <div className={`${styles.dashboardSection} ${animate ? styles.animateSecond : ""}`}>
        <ReservationsOverview 
          reservationStats={reservationStats}
          recentReservations={recentReservations}
        />
      </div>
      
      <div className={`${isAdmin ? styles.twoColumnSection : styles.fullWidthSection} ${animate ? styles.animateThird : ""}`}>
        {/* Staff section - visible to all roles */}
        <div className={styles.dashboardSectionHalf}>
          <StaffOverview staffData={recentStaff} />
        </div>
        
        {/* Admin section - only visible to admin and super_admin */}
        {isAdmin && (
          <div className={styles.dashboardSectionHalf}>
            <AdminOverview adminData={recentAdmins} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;