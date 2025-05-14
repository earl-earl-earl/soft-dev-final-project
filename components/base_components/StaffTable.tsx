// components/StaffTable.tsx
import React, { useState, useEffect } from 'react';
import styles from '../component_styles/StaffTable.module.css';

interface StaffMember {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;       // Changed from position to role
  position: string;   // New field for organizational position
}

interface StaffTableProps {
  staffData: StaffMember[];
  currentPage: number;
}

const StaffTable: React.FC<StaffTableProps> = ({ staffData, currentPage }) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage]);

  return (
    <div className={`${styles.tableContainer} ${animate ? styles.fadeIn : ''}`} key={currentPage}>
      <table className={styles.staffTable}>
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Phone Number</th>
            <th>Role</th>
            <th>Position</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staffData && staffData.length > 0 ? (
            staffData.map((staff) => (
              <tr key={staff.id}>
                <td>{staff.username}</td>
                <td>{staff.name}</td>
                <td>{staff.phoneNumber}</td>
                <td>{staff.role}</td>
                <td>{staff.position}</td>
                <td className={styles.actionsCell}>
                  <button className={styles.actionButton} title="Edit">
                    <i className="fa-regular fa-pencil"></i>
                    <span className={styles.tooltipText}>Edit</span>
                  </button>
                  <button className={`${styles.actionButton} ${styles.deactivateButton}`} title="Deactivate">
                    <i className="fa-regular fa-circle-minus"></i>
                    <span className={styles.tooltipText}>Deactivate</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className={styles.noStaffDataCell}>
                No staff members to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StaffTable;