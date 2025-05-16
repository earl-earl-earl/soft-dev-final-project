import React from 'react';
import styles from '../../../components/component_styles/Dashboard.module.css';
import { ReservationStats, ReservationData } from '../../../src/types/dashboard';
import SectionHeader from '../../../components/common/SectionHeader';
import StatsCardHorizontal from '../../../components/common/StatsCardHorizontal';

interface ReservationsOverviewProps {
  reservationStats: ReservationStats;
  recentReservations: ReservationData[];
}

const ReservationsOverview: React.FC<ReservationsOverviewProps> = ({ 
  reservationStats, 
  recentReservations 
}) => {
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'Accepted': return styles.statusAccepted;
      case 'Pending': return styles.statusPending;
      case 'Cancelled': return styles.statusCancelled;
      case 'Rejected': return styles.statusRejected;
      case 'Expired': return styles.statusExpired;
      case 'Confirmed_Pending_Payment': return styles.statusConfirmedPendingPayment;
      default: return '';
    }
  };

  return (
    <section className={styles.dashboardSection}>
      <SectionHeader 
        title="Recent Reservations"
        linkHref="/reservations"
        linkText="See All Reservations"
      />
      
      <div className={styles.statsCardsHorizontal}>
        <StatsCardHorizontal
          title="Check-ins"
          value={reservationStats.checkIns}
          iconClass="fa-regular fa-person-to-portal"
        />
        
        <StatsCardHorizontal
          title="Check-outs"
          value={reservationStats.checkOuts}
          iconClass="fa-regular fa-person-from-portal"
        />
        
        <StatsCardHorizontal
          title="Total Guests"
          value={reservationStats.totalGuests}
          iconClass="fa-regular fa-people-simple"
        />
        
        <StatsCardHorizontal
          title="Occupancy Rate"
          value={reservationStats.occupancyRate}
          iconClass="fa-regular fa-chart-line"
        />
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.dashboardTable}>
          <thead>
            <tr>
              <th>Res. ID</th>
              <th>Guest Name</th>
              <th>Room</th>
              <th>Check-in</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentReservations.map((reservation) => (
              <tr key={reservation.id}>
                <td>{reservation.id}</td>
                <td>{reservation.name}</td>
                <td>{reservation.room}</td>
                <td>{reservation.checkIn}</td>
                <td>
                  <span className={`${styles.statusPill} ${getStatusClass(reservation.status)}`}>
                    {reservation.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ReservationsOverview;