import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from '../component_styles/StaffTable.module.css'; // Assuming AdminTable uses similar styles

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
  role: string; // Role of the currently logged-in user, to determine if they are super_admin
}

const AdminTable: React.FC<AdminTableProps> = ({ adminData, currentPage, role}) => {
  const [animate, setAnimate] = useState(false);
  const [isSuperAdmin, setSuperAdmin] = useState(false);
  
  // Add state for edit form
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminMember & {
    password: string;
    confirmPassword: string;
  }>({
    id: "",
    username: "",
    name: "",
    email: "",
    phoneNumber: "",
    role: "admin",
    accessLevel: "",
    password: "",
    confirmPassword: ""
  });
  
  // New state for deactivation (copied and adapted from StaffTable)
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [adminToDeactivate, setAdminToDeactivate] = useState<AdminMember | null>(null);
  
  // Password visibility states for edit form
  const [editPasswordVisible, setEditPasswordVisible] = useState(false);
  const [editConfirmPasswordVisible, setEditConfirmPasswordVisible] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage]);

  useEffect(() => {
    setSuperAdmin(role === "super_admin");
  }, [role]);
  
  // Handler for opening the edit form
  const handleEditClick = (admin: AdminMember) => {
    setEditingAdmin({
      ...admin,
      password: "", // Clear passwords for security
      confirmPassword: ""
    });
    setIsEditAdminOpen(true);
  };

  // Handler for deactivation button click (copied and adapted from StaffTable)
  const handleDeactivateClick = (admin: AdminMember) => {
    setAdminToDeactivate(admin);
    setIsDeactivateModalOpen(true);
  };
  
  // Handler for confirming deactivation (copied and adapted from StaffTable)
  const handleConfirmDeactivate = () => {
    if (adminToDeactivate) {
      // Here you would normally send a request to deactivate the admin in your API
      console.log("Admin to be deactivated:", adminToDeactivate);
      
      // In a real application, you'd update the UI based on the API response
      // For now, just close the modal
      setIsDeactivateModalOpen(false);
      setAdminToDeactivate(null);
      
      // If you're managing admin state locally, you'd update it here
      // e.g., updateAdminList(adminToDeactivate.id, 'inactive');
    }
  };
  
  // Handler for edit form inputs
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingAdmin(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Toggle password visibility
  const toggleEditPasswordVisibility = () => {
    setEditPasswordVisible(!editPasswordVisible);
  };

  const toggleEditConfirmPasswordVisibility = () => {
    setEditConfirmPasswordVisible(!editConfirmPasswordVisible);
  };
  
  // Edit form submission
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally update this admin in your API or state
    console.log("Admin to be updated:", editingAdmin);
    setIsEditAdminOpen(false);
  };
  
  return (
    <div className={`${styles.tableContainer} ${animate ? styles.fadeIn : ''}`} key={currentPage}>
      <table className={styles.staffTable}> {/* Consider renaming this style class if it's admin-specific */}
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
                {isSuperAdmin && ( // Actions are only available if the current user is a super_admin
                  <td className={styles.actionsCell}>
                    <button 
                      className={styles.actionButton} 
                      title="Edit"
                      onClick={() => handleEditClick(admin)}
                    >
                      <i className="fa-regular fa-pencil"></i>
                      <span className={styles.tooltipText}>Edit</span>
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.deactivateButton}`} 
                      title="Deactivate"
                      onClick={() => handleDeactivateClick(admin)} // Added onClick handler
                    >
                      <i className="fa-regular fa-circle-minus"></i>
                      <span className={styles.tooltipText}>Deactivate</span>
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className={styles.noStaffDataCell}> {/* Consider renaming this style class */}
                No admin members to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Edit Admin Form */}
      {isEditAdminOpen && 
        ReactDOM.createPortal(
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Edit Admin</h3>
                <button className={styles.closeButton} onClick={() => setIsEditAdminOpen(false)}>
                  <i className="fa-regular fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className={styles.modalBody}>
                  <h4 className={styles.formSectionTitle}>User Details</h4>
                  <div className={styles.formGroup}>
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={editingAdmin.name}
                      onChange={handleEditChange}
                      className={styles.formControl}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editingAdmin.email}
                      onChange={handleEditChange}
                      className={styles.formControl}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="phoneNumber">Phone Number</label>
                    <input
                      type="text"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={editingAdmin.phoneNumber}
                      onChange={handleEditChange}
                      className={styles.formControl}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="password">Password (leave blank to keep current)</label>
                    <div className={styles.passwordInputContainer}>
                      <input
                        type={editPasswordVisible ? "text" : "password"}
                        id="password"
                        name="password"
                        value={editingAdmin.password}
                        onChange={handleEditChange}
                        className={styles.formControl}
                        placeholder="••••••••"
                      />
                      <button 
                        type="button" 
                        className={styles.eyeIcon} 
                        onClick={toggleEditPasswordVisibility}
                      >
                        <i className={editPasswordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                      </button>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className={styles.passwordInputContainer}>
                      <input
                        type={editConfirmPasswordVisible ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={editingAdmin.confirmPassword}
                        onChange={handleEditChange}
                        className={styles.formControl}
                        placeholder="••••••••"
                      />
                      <button 
                        type="button" 
                        className={styles.eyeIcon} 
                        onClick={toggleEditConfirmPasswordVisibility}
                      >
                        <i className={editConfirmPasswordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                      </button>
                    </div>
                  </div>
                  
                  <h4 className={styles.formSectionTitle}>Role & Access</h4>
                  <div className={styles.formGroup}>
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      name="role"
                      value={editingAdmin.role}
                      onChange={handleEditChange}
                      className={styles.formControl}
                      required
                    >
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="accessLevel">Access Level</label>
                    <input
                      type="text"
                      id="accessLevel"
                      name="accessLevel"
                      value={editingAdmin.accessLevel}
                      onChange={handleEditChange}
                      className={styles.formControl}
                      required
                    />
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setIsEditAdminOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.primaryButton}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      }

      {/* Deactivate Admin Confirmation Modal (copied and adapted from StaffTable) */}
      {isDeactivateModalOpen && adminToDeactivate && 
        ReactDOM.createPortal(
          <div className={styles.overlay}>
            <div className={`${styles.modal} ${styles.confirmationModal}`}>
              <div className={styles.modalHeader}>
                <h3>Deactivate Admin</h3>
                <button className={styles.closeButton} onClick={() => setIsDeactivateModalOpen(false)}>
                  <i className="fa-regular fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.warningIcon}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <p className={styles.confirmationText}>
                  Are you sure you want to deactivate <strong>{adminToDeactivate.name}</strong>?
                </p>
                <p className={styles.confirmationSubtext}>
                  This will prevent them from accessing the system until reactivated by a super administrator.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.secondaryButton} 
                  onClick={() => setIsDeactivateModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className={`${styles.primaryButton} ${styles.dangerButton}`} 
                  onClick={handleConfirmDeactivate}
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
};

export default AdminTable;