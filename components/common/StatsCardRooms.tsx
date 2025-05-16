import React from 'react';
import styles from '../component_styles/Rooms.module.css';

interface StatsCardProps {
  title: string;
  value: number;
  change: number;
  isPositive: boolean;
  animate?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  isPositive,
  animate = false,
}) => (
  <div className={`${styles.statsCard} ${animate ? styles.animate : ""}`}>
    <h3>{title}</h3>
    <div className={styles.statsValue}>{value}</div>
    <div
      className={`${styles.statsChange} ${
        isPositive ? styles.positive : styles.negative
      }`}
    >
      <i className={`fa-regular fa-arrow-${isPositive ? "up" : "down"}`}></i>
      {Math.abs(change)}% vs last month
    </div>
  </div>
);

export default StatsCard;