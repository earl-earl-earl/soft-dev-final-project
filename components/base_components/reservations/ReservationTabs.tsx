import React from "react";
import styles from "../../../components/component_styles/Reservations.module.css";
import { ReservationType } from "../../../types/reservation";

interface ReservationTabsProps {
  reservationType: ReservationType;
  onTypeChange: (type: ReservationType) => void;
  onNewReservation: () => void;
}

const ReservationTabs: React.FC<ReservationTabsProps> = ({
  reservationType,
  onTypeChange,
  onNewReservation
}) => {
  return (
    <div className={styles.headerTabs}>
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${reservationType === "all" ? styles.activeTab : ""}`}
          onClick={() => onTypeChange("all")}
        >
          <i className="fa-regular fa-list"></i> All Reservations
        </button>
        <button 
          className={`${styles.tabButton} ${reservationType === "online" ? styles.activeTab : ""}`}
          onClick={() => onTypeChange("online")}
        >
          <i className="fa-regular fa-mobile"></i> Online Reservations
        </button>
        <button 
          className={`${styles.tabButton} ${reservationType === "direct" ? styles.activeTab : ""}`}
          onClick={() => onTypeChange("direct")}
        >
          <i className="fa-regular fa-bell-concierge"></i> Direct Reservations
        </button>
      </div>
      <button 
        className={styles.newReservationButton} 
        onClick={onNewReservation}
      >
        <i className="fa-regular fa-plus"></i> New Reservation
      </button>
    </div>
  );
};

export default ReservationTabs;