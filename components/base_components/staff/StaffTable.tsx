import React, { useState, useEffect } from 'react';
import { StaffMember } from '../../../src/types/staff';
import styles from '../../component_styles/StaffTable.module.css';

interface StaffTableProps {
  staffData: StaffMember[];
  currentPage: number;
  userRole: string;
  onEdit?: (staff: StaffMember) => void;
  onToggleStatus?: (staff: StaffMember) => void;
}

const StaffTable: React.FC<StaffTableProps> = ({ 
  staffData, 
  currentPage, 
  userRole,
  onEdit,
  onToggleStatus
}) => {
  const [animate, setAnimate] = useState(false);
  const [isAdmin, setAdmin] = useState(false);
  
  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage]);

  useEffect(() => {
    setAdmin(userRole === "admin" || userRole === "super_admin");
  }, [userRole]);
  
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
            {isAdmin && (
              <th>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {staffData && staffData.length > 0 ? (
            staffData.map((staff) => (
              <tr key={staff.id} className={staff.isActive === false ? styles.deactivatedRow : ''}>
                <td>{staff.username}</td>
                <td>{staff.name}</td>
                <td>{staff.phoneNumber}</td>
                <td>{staff.role}</td>
                <td>{staff.position}</td>
                {isAdmin && onEdit && onToggleStatus && (
                <td className={styles.actionsCell}>
                  <button 
                    className={styles.actionButton} 
                    title="Edit"
                    onClick={() => onEdit(staff)}
                  >
                    <i className="fa-regular fa-pencil"></i>
                    <span className={styles.tooltipText}>Edit</span>
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.deactivateButton}`} 
                    title={staff.isActive === false ? "Activate" : "Deactivate"}
                    onClick={() => onToggleStatus(staff)}
                  >
                    <i className={`fa-regular ${staff.isActive === false ? "fa-circle-plus" : "fa-circle-minus"}`}></i>
                    <span className={styles.tooltipText}>
                      {staff.isActive === false ? "Activate" : "Deactivate"}
                    </span>
                  </button>
                </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={isAdmin ? 6 : 5} className={styles.noStaffDataCell}>
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