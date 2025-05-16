import React from 'react';
import styles from '../../components/component_styles/Dashboard.module.css';

interface StatsCardHorizontalProps {
  title: string;
  value: string;
  iconClass: string;
}

const StatsCardHorizontal: React.FC<StatsCardHorizontalProps> = ({ title, value, iconClass }) => {
  return (
    <div className={styles.statCardHorizontal}>
      <p className={styles.statTitle}>{title}</p>
      <div className={styles.statValueContainer}>
        <h3 className={styles.statValue}>{value}</h3>
        <i className={iconClass}></i>
      </div>
    </div>
  );
};

export default StatsCardHorizontal;