// components/StaffTable.tsx
import React, { useState, useEffect } from 'react';
import styles from './StaffTable.module.css';

interface StaffMember {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  position: string;
}

interface StaffTableProps {
  staffData: StaffMember[];
  currentPage: number; // For triggering re-render and animation
}

const StaffTable: React.FC<StaffTableProps> = ({ staffData, currentPage }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation on page change
    setAnimate(false); // Reset animation state
    const timer = setTimeout(() => setAnimate(true), 50); // Apply animation class after a short delay
    return () => clearTimeout(timer);
  }, [currentPage]); // Depend on currentPage

  if (!staffData || staffData.length === 0) {
    return <p className={styles.noData}>No staff members to display.</p>;
  }

  return (
    <div className={`${styles.tableContainer} ${animate ? styles.fadeIn : ''}`} key={currentPage}>
      <table className={styles.staffTable}>
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Position</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staffData.map((staff) => (
            <tr key={staff.id}>
              <td>{staff.username}</td>
              <td>{staff.name}</td>
              <td>{staff.email}</td>
              <td>{staff.phoneNumber}</td>
              <td>{staff.position}</td>
              <td className={styles.actionsCell}>
                <button className={styles.actionButton} title="Edit">
                  <i className="fa-regular fa-pencil"></i>
                </button>
                <button className={`${styles.actionButton} ${styles.deactivateButton}`} title="Deactivate">
                  <i className="fa-regular fa-circle-minus"></i> {/* Or fa-trash-alt */}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffTable;