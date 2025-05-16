import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from '../../component_styles/StaffTable.module.css';
import { ACCESS_LEVELS, ADMIN_ROLES, AdminFormData, AdminMember } from '../../../src/types/admin';

interface AdminFormProps {
  isOpen: boolean;
  admin?: AdminMember;
  onClose: () => void;
  onSubmit: (data: AdminFormData) => void;
  title: string;
  submitLabel: string;
}

const AdminForm: React.FC<AdminFormProps> = ({
  isOpen,
  admin,
  onClose,
  onSubmit,
  title,
  submitLabel
}) => {
  const initialData: AdminFormData = admin ? {
    username: admin.username,
    name: admin.name,
    email: admin.email,
    phoneNumber: admin.phoneNumber,
    role: admin.role,
    accessLevel: admin.accessLevel,
    password: "",
    confirmPassword: ""
  } : {
    username: "",
    name: "",
    email: "",
    phoneNumber: "",
    role: "admin",
    accessLevel: "",
    password: "",
    confirmPassword: ""
  };
  
  const [formData, setFormData] = useState<AdminFormData>(initialData);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <h4 className={styles.formSectionTitle}>User Details</h4>
            {!admin && (
              <div className={styles.formGroup}>
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={styles.formControl}
                  required
                />
              </div>
            )}
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
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
                value={formData.email}
                onChange={handleChange}
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
                value={formData.phoneNumber}
                onChange={handleChange}
                className={styles.formControl}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">{admin ? "Password (leave blank to keep current)" : "Password"}</label>
              <div className={styles.passwordInputContainer}>
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={styles.formControl}
                  placeholder="••••••••"
                  required={!admin}
                />
                <button 
                  type="button" 
                  className={styles.eyeIcon} 
                  onClick={togglePasswordVisibility}
                >
                  <i className={passwordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                </button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className={styles.passwordInputContainer}>
                <input
                  type={confirmPasswordVisible ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={styles.formControl}
                  placeholder="••••••••"
                  required={!admin || !!formData.password}
                />
                <button 
                  type="button" 
                  className={styles.eyeIcon} 
                  onClick={toggleConfirmPasswordVisibility}
                >
                  <i className={confirmPasswordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
                </button>
              </div>
            </div>
            
            <h4 className={styles.formSectionTitle}>Role & Access</h4>
            <div className={styles.formGroup}>
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={styles.formControl}
                required
              >
                {ADMIN_ROLES.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="accessLevel">Access Level</label>
              <select
                id="accessLevel"
                name="accessLevel"
                value={formData.accessLevel}
                onChange={handleChange}
                className={styles.formControl}
                required
              >
                <option value="">Select Access Level</option>
                {ACCESS_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AdminForm;