import React, { useState, useEffect } from 'react';
import styles from '../component_styles/StaffTable.module.css';

interface StaffMember {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  position: string;
}

interface StaffTableProps {
  staffData: StaffMember[];
  currentPage: number;
  role: string;
}

const StaffTable: React.FC<StaffTableProps> = ({ staffData, currentPage, role}) => {
  const [animate, setAnimate] = useState(false);
  const [isAdmin, setAdmin] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage]);

  useEffect(() => {
    setAdmin(role === "admin" || role === "super_admin");
  }, [role]);
  
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
                {isAdmin && (
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
)}

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
  }
;

export default StaffTable;