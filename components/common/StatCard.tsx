import React from "react";
import styles from "../../components/component_styles/Reservations.module.css";

interface StatCardProps {
  title: string;
  value: string;
  dateRange: string;
  valueIconClass?: string;
  dateRangeColor?: string;
  dateRangeBg?: string;
  animate?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  dateRange,
  valueIconClass,
  dateRangeColor = "#6c757d",
  dateRangeBg = "red",
  animate = false,
}) => {
  return (
    <div className={`${styles.statCard} ${animate ? styles.animate : ""}`}>
      <div className={styles.statCardTop}>
        <p className={styles.statTitle}>{title}</p>
        <div className={styles.statValueContainer}>
          <h3 className={styles.statValue}>{value}</h3>
          {valueIconClass && (
            <i className={`${valueIconClass} ${styles.statValueIcon}`}></i>
          )}
        </div>
      </div>
      <div
        className={styles.statCardBottom}
        style={{ backgroundColor: dateRangeBg }}
      >
        <p className={styles.statDateRange} style={{ color: dateRangeColor }}>
          {dateRange}
        </p>
      </div>
    </div>
  );
};

export default StatCard;