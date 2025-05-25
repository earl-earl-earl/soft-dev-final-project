import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from '../../component_styles/StaffTable.module.css';
import { ACCESS_LEVELS, ADMIN_FORM_SELECTABLE_ROLES, AdminFormData, AdminMember } from '../../../src/types/admin'; // Use ADMIN_FORM_SELECTABLE_ROLES

interface AdminFormProps {
  isOpen: boolean;
  admin?: AdminMember; // For editing an existing admin (isEditing can be derived from this)
  onClose: () => void;
  onSubmit: (data: AdminFormData) => void;
  title: string;
  submitLabel: string;
formErrors?: Record<string, string>; 
}

// Password validation helper (same as in StaffForm)
const validatePasswordPolicy = (password: string): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  if (password.length < 8) messages.push("Be at least 8 characters long.");
  if (!/[A-Z]/.test(password)) messages.push("Contain at least one uppercase letter.");
  if (!/[a-z]/.test(password)) messages.push("Contain at least one lowercase letter.");
  if (!/[0-9]/.test(password)) messages.push("Contain at least one number.");
  if (!/[^A-Za-z0-9]/.test(password)) messages.push("Contain at least one special character.");
  return { isValid: messages.length === 0, messages };
};

const AdminForm: React.FC<AdminFormProps> = ({
  isOpen,
  admin, // If 'admin' is provided, it's an edit operation
  onClose,
  onSubmit,
  title,
  submitLabel
}) => {
  const isEditing = !!admin; // Determine if we are in edit mode

  const createInitialFormData = (): AdminFormData => ({
    name: admin?.name || "",
    email: admin?.email || "",
    username: admin?.username || "",
    phoneNumber: admin?.phoneNumber || "",


    // For 'admin' role users created by this form, their role in users table is 'admin'
    // The 'staff.is_admin' flag will be true.
    role: admin?.role as "Admin" | "Staff" || (ADMIN_FORM_SELECTABLE_ROLES.length > 0
      ? (ADMIN_FORM_SELECTABLE_ROLES[0].value === "admin"
          ? "admin"
          : "staff")
      : "admin"), // Default to 'Admin' if no roles available
    position: admin?.position || (ACCESS_LEVELS.length > 0 ? ACCESS_LEVELS[0] : ""),
    password: "",
    confirmPassword: "",
  });

  const [formData, setFormData] = useState<AdminFormData>(createInitialFormData());
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordPolicyErrors, setPasswordPolicyErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormData());
      setFormError(null);
      setPasswordPolicyErrors([]);
      setPasswordVisible(false);
      setConfirmPasswordVisible(false);
    }
  }, [admin, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // 'isAdmin' flag is not directly in AdminFormData as it's implicit for 'admin' role
      // The backend API will set staff.is_admin = true.
      // If role could be changed here to something non-admin
      // if (name === 'role') {
      //   updated.isAdmin = value === 'admin' || value === 'super_admin'; 
      // }
      if (name === 'password' && value.length > 0) {
        const policyCheck = validatePasswordPolicy(value);
        setPasswordPolicyErrors(policyCheck.messages);
      } else if (name === 'password' && value.length === 0) {
        setPasswordPolicyErrors([]);
      }
      return updated;
    });
  };

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
  const toggleConfirmPasswordVisibility = () => setConfirmPasswordVisible(!confirmPasswordVisible);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setPasswordPolicyErrors([]);

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        setFormError("A valid email address is required."); return;
    }
    // Username validation (e.g., if required or has specific format)
    // if (!formData.username?.trim() && !isEditing) { // Example if username becomes required
    //     setFormError("Username is required."); return;
    // }

    const isPasswordBeingSet = !!formData.password || !isEditing;
    if (isPasswordBeingSet) {
        if (!formData.password) { // Should be caught by required={!isEditing}
            setFormError("Password is required for new admins or when changing password."); return;
        }
        const policyCheck = validatePasswordPolicy(formData.password);
        if (!policyCheck.isValid) {
            setPasswordPolicyErrors(policyCheck.messages);
            setFormError("Password does not meet security requirements."); return;
        }
        if (formData.password !== formData.confirmPassword) {
          setFormError("Passwords do not match."); return;
        }
    }

    const dataToSubmit: AdminFormData = { ...formData };
    if (isEditing && !formData.password) {
      delete dataToSubmit.password;
      delete dataToSubmit.confirmPassword;
    }
    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3> {/* Use dynamic title passed as prop */}
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.modalBody}>
            {formError && <p className={styles.formErrorMessage /* Add this style */}>{formError}</p>}
            
            <h4 className={styles.formSectionTitle}>Admin User Details</h4>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={styles.formControl} required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address (for login) *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={styles.formControl} required disabled={isEditing}/>
              {isEditing && <small className={styles.formTextMuted /* Add this style */}>Email cannot be changed as it's tied to the login account.</small>}
            </div>
             <div className={styles.formGroup}>
              <label htmlFor="username">Display Username (Optional)</label>
              <input type="text" id="username" name="username" value={formData.username || ''} onChange={handleChange} className={styles.formControl} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber">Phone Number (Optional)</label>
              <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} className={styles.formControl}/>
            </div>

            <h4 className={styles.formSectionTitle}>Account Password</h4>
            <div className={styles.formGroup}>
              <label htmlFor="password">{isEditing ? "New Password (leave blank to keep current)" : "Password *"}</label>
              <div className={styles.passwordInputContainer}>
                <input type={passwordVisible ? "text" : "password"} id="password" name="password" value={formData.password} onChange={handleChange} className={`${styles.formControl} ${passwordPolicyErrors.length > 0 && formData.password ? styles.inputError : ''}`} required={!isEditing} placeholder={isEditing ? "Enter new password" : "Min. 8 characters"} autoComplete="new-password" />
                <button type="button" className={styles.eyeIcon} onClick={togglePasswordVisibility} aria-label="Toggle password visibility"><i className={passwordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i></button>
              </div>
              {passwordPolicyErrors.length > 0 && formData.password && (
                <ul className={styles.passwordPolicyErrorList /* Add this style */}>
                  {passwordPolicyErrors.map((errorMsg, index) => (<li key={index}>{errorMsg}</li>))}
                </ul>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">{isEditing && !formData.password ? 'Confirm New Password' : 'Confirm Password *'}</label>
              <div className={styles.passwordInputContainer}>
                <input type={confirmPasswordVisible ? "text" : "password"} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={styles.formControl} required={!isEditing || (!!formData.password)} placeholder={isEditing && !formData.password ? '' : 'Re-type password'} autoComplete="new-password"/>
                <button type="button" className={styles.eyeIcon} onClick={toggleConfirmPasswordVisibility} aria-label="Toggle confirm password visibility"><i className={confirmPasswordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i></button>
              </div>
            </div>

            <h4 className={styles.formSectionTitle}>Role & Access Level</h4>
            <div className={styles.formGroup}>
              <label htmlFor="role">Role *</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className={styles.formControl} required >
                {/* Assuming ADMIN_FORM_SELECTABLE_ROLES from types/admin.ts is like [{value: 'admin', label: 'Admin'}] */}
                {ADMIN_FORM_SELECTABLE_ROLES.map(roleOpt => (
                  <option key={roleOpt.value} value={roleOpt.value}>{roleOpt.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="position">Access Level (Position) *</label> {/* Changed name to 'position' */}
              <select id="position" name="position" value={formData.position} onChange={handleChange} className={styles.formControl} required >
                <option value="">Select Access Level</option>
                {ACCESS_LEVELS.map((level) => (<option key={level} value={level}>{level}</option>))}
              </select>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.primaryButton}>{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AdminForm;