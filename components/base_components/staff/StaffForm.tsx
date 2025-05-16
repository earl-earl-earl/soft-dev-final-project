import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from '../../component_styles/StaffFeature.module.css';
import { StaffFormData, POSITIONS, ROLES } from '../../../src/types/staff';

interface StaffFormProps {
  isOpen: boolean;
  initialData: Partial<StaffFormData>;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (data: StaffFormData) => void;
}

const StaffForm: React.FC<StaffFormProps> = ({
  isOpen,
  initialData,
  isEditing,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<StaffFormData>({
    name: initialData.name || '',
    email: initialData.email || '',
    phoneNumber: initialData.phoneNumber || '',
    password: initialData.password || '',
    confirmPassword: initialData.confirmPassword || '',
    role: initialData.role || 'Staff',
    position: initialData.position || ''
  });
  
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
          <h3>{isEditing ? 'Edit Staff' : 'Add New Staff'}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <h4 className={styles.formSectionTitle}>User Details</h4>
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
              <label htmlFor="password">
                {isEditing ? 'Password (leave blank to keep current)' : 'Password'}
              </label>
              <div className={styles.passwordInputContainer}>
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={styles.formControl}
                  required={!isEditing}
                  placeholder={isEditing ? '••••••••' : ''}
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
                  required={!isEditing || formData.password !== ''}
                  placeholder={isEditing ? '••••••••' : ''}
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
            
            <h4 className={styles.formSectionTitle}>Role & Position</h4>
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
                {ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="position">Position</label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={styles.formControl}
                required
              >
                <option value="">Select Position</option>
                {POSITIONS.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton}>
              {isEditing ? 'Save Changes' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default StaffForm;