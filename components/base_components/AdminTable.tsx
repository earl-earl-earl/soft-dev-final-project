import React, { useState, useEffect } from 'react';
import styles from '../component_styles/StaffTable.module.css';

interface AdminMember {
  id: string;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  accessLevel: string;
}

interface AdminTableProps {
  adminData: AdminMember[];
  currentPage: number;
  role: string;
}

const AdminTable: React.FC<AdminTableProps> = ({ adminData, currentPage, role}) => {
  const [animate, setAnimate] = useState(false);
  const [isSuperAdmin, setSuperAdmin] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage]);

  useEffect(() => {
    setSuperAdmin(role === "super_admin");
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
            <th>Access Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {adminData && adminData.length > 0 ? (
            adminData.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.username}</td>
                <td>{admin.name}</td>
                <td>{admin.phoneNumber}</td>
                <td>{admin.role}</td>
                <td>{admin.accessLevel}</td>
                {isSuperAdmin && (
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
                No admin members to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;