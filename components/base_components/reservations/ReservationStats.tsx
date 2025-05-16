import React from "react";
import styles from "../../../components/component_styles/Reservations.module.css";
import StatCard from "../../common/StatCard";

interface ReservationStatsProps {
  statistics: {
    checkIns: number;
    checkOuts: number;
    totalGuests: number;
    occupancyRate: number;
  };
  animate: boolean;
}

const ReservationStats: React.FC<ReservationStatsProps> = ({
  statistics,
  animate
}) => {
  return (
    <div className={styles.statsCardsContainer}>
      <StatCard
        title="Total Check-ins"
        value={statistics.checkIns.toString()}
        valueIconClass="fa-regular fa-person-to-portal"
        dateRange="Jan 01 - Apr 30, 2025"
        dateRangeColor="#007bff"
        dateRangeBg="#e7f3ff"
        animate={animate}
      />
      <StatCard
        title="Total Check-outs"
        value={statistics.checkOuts.toString()}
        valueIconClass="fa-regular fa-person-from-portal"
        dateRange="Jan 01 - Apr 30, 2025"
        dateRangeColor="#6c757d"
        dateRangeBg="#f8f9fa"
        animate={animate}
      />
      <StatCard
        title="Total Guests"
        value={statistics.totalGuests.toString()}
        valueIconClass="fa-regular fa-people-simple"
        dateRange="Jan 01 - Apr 30, 2025"
        dateRangeColor="#6c757d"
        dateRangeBg="#f8f9fa"
        animate={animate}
      />
      <StatCard
        title="Occupancy Rate"
        value={`${statistics.occupancyRate}%`}
        valueIconClass="fa-regular fa-chart-line"
        dateRange="Jan 01 - Apr 30, 2025"
        dateRangeColor="#6c757d"
        dateRangeBg="#f8f9fa"
        animate={animate}
      />
    </div>
  );
};

export default ReservationStats;