import React from 'react';
import styles from '../../components/component_styles/Dashboard.module.css';

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number;
  isPositive?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  change, 
  isPositive = true
}) => {
  return (
    <div className={styles.statsCard}>
      <h3>{title}</h3>
      <div className={styles.statsValue}>{value}</div>
      {change !== undefined && (
        <div className={`${styles.statsChange} ${isPositive ? styles.positive : styles.negative}`}>
          <i className={`fa-regular ${isPositive ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );
};

export default StatsCard;