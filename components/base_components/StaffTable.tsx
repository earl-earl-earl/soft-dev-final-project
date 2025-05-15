import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  const [/* admin */, setAdmin] = useState(false);
  
  // Add state for edit form
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember & {
    password: string;
    confirmPassword: string;
  }>({
    id: "",
    username: "",
    name: "",
    email: "",
    phoneNumber: "",
    role: "Staff",
    position: "",
    password: "",
    confirmPassword: ""
  });
  
  // New state for deactivation
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [staffToDeactivate, setStaffToDeactivate] = useState<StaffMember | null>(null);
  
  // Password visibility states for edit form
  const [editPasswordVisible, setEditPasswordVisible] = useState(false);
  const [editConfirmPasswordVisible, setEditConfirmPasswordVisible] = useState(false);

  useEffect(() => {
    setAnimate(false);
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage]);

  useEffect(() => {
    setAdmin(role === "admin" || role === "super_admin");
  }, [role]);
  
  // Handler for opening the edit form
  const handleEditClick = (staff: StaffMember) => {
    setEditingStaff({
      ...staff,
      password: "", // Clear passwords for security
      confirmPassword: ""
    });
    setIsEditStaffOpen(true);
  };
  
  // Handler for deactivation button click
  const handleDeactivateClick = (staff: StaffMember) => {
    setStaffToDeactivate(staff);
    setIsDeactivateModalOpen(true);
  };
  
  // Handler for confirming deactivation
  const handleConfirmDeactivate = () => {
    if (staffToDeactivate) {
      // Here you would normally send a request to deactivate the staff in your API
      console.log("Staff to be deactivated:", staffToDeactivate);
      
      // In a real application, you'd update the UI based on the API response
      // For now, just close the modal
      setIsDeactivateModalOpen(false);
      setStaffToDeactivate(null);
      
      // If you're managing staff state locally, you'd update it here
      // e.g., updateStaffList(staffToDeactivate.id, 'inactive');
    }
  };
  
  // Handler for edit form inputs
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditingStaff(prev => ({
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
    // Here you would normally update this staff in your API or state
    console.log("Staff to be updated:", editingStaff);
    setIsEditStaffOpen(false);
  };
  
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
                  <button 
                    className={styles.actionButton} 
                    title="Edit"
                    onClick={() => handleEditClick(staff)}
                  >
                    <i className="fa-regular fa-pencil"></i>
                    <span className={styles.tooltipText}>Edit</span>
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.deactivateButton}`} 
                    title="Deactivate"
                    onClick={() => handleDeactivateClick(staff)}
                  >
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

      {/* Edit Staff Form */}
      {isEditStaffOpen && 
        ReactDOM.createPortal(
          <div className={styles.overlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Edit Staff</h3>
                <button className={styles.closeButton} onClick={() => setIsEditStaffOpen(false)}>
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
                      value={editingStaff.name}
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
                      value={editingStaff.email}
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
                      value={editingStaff.phoneNumber}
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
                        value={editingStaff.password}
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
                        value={editingStaff.confirmPassword}
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
                  
                  <h4 className={styles.formSectionTitle}>Role & Position</h4>
                  <div className={styles.formGroup}>
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      name="role"
                      value={editingStaff.role}
                      onChange={handleEditChange}
                      className={styles.formControl}
                      required
                    >
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="position">Position</label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={editingStaff.position}
                      onChange={handleEditChange}
                      className={styles.formControl}
                      required
                    />
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setIsEditStaffOpen(false)}>
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

      {/* Deactivate Staff Confirmation Modal */}
      {isDeactivateModalOpen && staffToDeactivate && 
        ReactDOM.createPortal(
          <div className={styles.overlay}>
            <div className={`${styles.modal} ${styles.confirmationModal}`}>
              <div className={styles.modalHeader}>
                <h3>Deactivate Staff</h3>
                <button className={styles.closeButton} onClick={() => setIsDeactivateModalOpen(false)}>
                  <i className="fa-regular fa-times"></i>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.warningIcon}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <p className={styles.confirmationText}>
                  Are you sure you want to deactivate <strong>{staffToDeactivate.name}</strong>?
                </p>
                <p className={styles.confirmationSubtext}>
                  This will prevent them from accessing the system until reactivated by an administrator.
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

export default StaffTable;