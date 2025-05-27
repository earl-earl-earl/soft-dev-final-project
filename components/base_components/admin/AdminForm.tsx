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
  formErrorsProp?: Record<string, string>; 
}

// Password validation helper
const validatePasswordPolicy = (password: string): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  if (password.length < 8) messages.push("Be at least 8 characters long.");
  if (!/[A-Z]/.test(password)) messages.push("Contain at least one uppercase letter.");
  if (!/[a-z]/.test(password)) messages.push("Contain at least one lowercase letter.");
  if (!/[0-9]/.test(password)) messages.push("Contain at least one number.");
  if (!/[^A-Za-z0-9]/.test(password)) messages.push("Contain at least one special character.");
  return { isValid: messages.length === 0, messages };
};

// Regex for validations
const fullNameRegex = /^[a-zA-Z\s'-]*$/; 
const usernameRegex = /^[a-zA-Z0-9]*$/;
const emailRegex = /^\S+@\S+\.\S+$/;
const phoneRegex = /^[0-9+\-()\s]*$/; // Allows digits, +, -, (), spaces

const AdminForm: React.FC<AdminFormProps> = ({
  isOpen,
  admin,
  onClose,
  onSubmit,
  title,
  submitLabel
}) => {
  const isEditing = !!admin;

  const createInitialFormData = (): AdminFormData => ({
    name: admin?.name || "",
    email: admin?.email || "",
    username: admin?.username || "",
    phoneNumber: admin?.phoneNumber || "",
    role: admin?.role as "Admin" | "Staff" || (ADMIN_FORM_SELECTABLE_ROLES.length > 0
      ? (ADMIN_FORM_SELECTABLE_ROLES[0].value === "admin"
          ? "admin"
          : "staff")
      : "admin"), 
    password: "",
    confirmPassword: "",
  });

  const [formData, setFormData] = useState<AdminFormData>(createInitialFormData());
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null); 
  const [passwordPolicyErrors, setPasswordPolicyErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormData());
      setFormError(null);
      setPasswordPolicyErrors([]);
      setFieldErrors({}); 
      setPasswordVisible(false);
      setConfirmPasswordVisible(false);
    }
  }, [admin, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (formError) setFormError(null);
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    if (name === 'password' && formError && (formError.toLowerCase().includes("password") || formError.toLowerCase().includes("passwords"))){
        setFormError(null);
    }

    if (name === 'password') {
      if (value.length > 0) {
        const policyCheck = validatePasswordPolicy(value);
        setPasswordPolicyErrors(policyCheck.messages);
      } else {
        setPasswordPolicyErrors([]);
      }
    }

    if (name === 'name') {
      if (value && !fullNameRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, name: "Full Name: Only letters, spaces, hyphens (-), and apostrophes (') are allowed." }));
      }
    } else if (name === 'username') {
      if (value && !usernameRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, username: "Display Username: Only letters and numbers are allowed." }));
      }
    } else if (name === 'email') {
      if (value && !emailRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address." }));
      }
    } else if (name === 'phoneNumber') {
      if (value && !phoneRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, phoneNumber: "Phone Number: Only numbers and typical phone characters (+, -, (), spaces) are allowed." }));
      }
    }
  };

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
  const toggleConfirmPasswordVisibility = () => setConfirmPasswordVisible(!confirmPasswordVisible);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null); 
    
    let currentSubmitFieldErrors: Record<string, string> = {};
    let validationFailed = false;

    // 1. Full Name
    if (!formData.name.trim()) {
        currentSubmitFieldErrors.name = "Full Name is required.";
        validationFailed = true;
    } else if (!fullNameRegex.test(formData.name)) {
        currentSubmitFieldErrors.name = "Full Name: Only letters, spaces, hyphens (-), and apostrophes (') are allowed.";
        validationFailed = true;
    }

    // 2. Email
    if (!formData.email.trim()) {
        currentSubmitFieldErrors.email = "Email address is required.";
        validationFailed = true;
    } else if (!emailRegex.test(formData.email)) {
        currentSubmitFieldErrors.email = "Please enter a valid email address.";
        validationFailed = true;
    }

    // 3. Display Username (optional)
    if (formData.username && formData.username.trim() && !usernameRegex.test(formData.username)) {
        currentSubmitFieldErrors.username = "Display Username: Only letters and numbers are allowed.";
        validationFailed = true;
    }

    // 4. Phone Number (optional)
    if (formData.phoneNumber && formData.phoneNumber.trim() && !phoneRegex.test(formData.phoneNumber)) {
        currentSubmitFieldErrors.phoneNumber = "Phone Number: Only numbers and typical phone characters (+, -, (), spaces) are allowed.";
        validationFailed = true;
    }
    
    setFieldErrors(currentSubmitFieldErrors); 

    // 5. Password validations
    const isPasswordBeingSet = !!formData.password || !isEditing;
    let tempPasswordPolicyErrors: string[] = []; 

    if (isPasswordBeingSet) {
        if (!formData.password) { 
            // This specific error can be shown at the top, or also tied to the field
            // For consistency with how password errors are generally handled, we can use setFormError
            setFormError("Password is required for new admins or when changing password.");
            validationFailed = true;
        } else {
            const policyCheck = validatePasswordPolicy(formData.password);
            if (!policyCheck.isValid) {
                tempPasswordPolicyErrors = policyCheck.messages;
                setFormError("Password does not meet security requirements."); // General message for password policy failure
                validationFailed = true;
            }
            if (formData.password !== formData.confirmPassword) {
              setFormError("Passwords do not match."); // General message for mismatch
              validationFailed = true;
            }
        }
    }
    setPasswordPolicyErrors(tempPasswordPolicyErrors);

    if (validationFailed) {
        if (!formError && Object.keys(currentSubmitFieldErrors).length > 0) {
            setFormError("Please correct the errors highlighted below.");
        } else if (!formError && (isPasswordBeingSet && (!formData.password || tempPasswordPolicyErrors.length > 0 || formData.password !== formData.confirmPassword))) {
            // This case is already handled by setting formError directly in password checks
        }
        return; 
    }

    const dataToSubmit: AdminFormData = { ...formData };
    if (isEditing && !formData.password) {
      delete dataToSubmit.password;
      delete dataToSubmit.confirmPassword;
    }
    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  const passwordInputShouldBeRed = 
    (passwordPolicyErrors.length > 0 && formData.password) || 
    formError === "Password is required for new admins or when changing password." ||
    formError === "Password does not meet security requirements." ||
    formError === "Passwords do not match.";
  const confirmPasswordInputShouldBeRed = formError === "Passwords do not match.";

  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-times"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.modalBody}>
            {formError && <p className={styles.formErrorMessage}>{formError}</p>} 
            
            <h4 className={styles.formSectionTitle}>Admin User Details</h4>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className={`${styles.formControl} ${fieldErrors.name ? styles.inputError : ''}`} 
                required 
              />
              {fieldErrors.name && <p className={styles.inputFieldErrorText}>{fieldErrors.name}</p>}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address (for login) *</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                className={`${styles.formControl} ${fieldErrors.email ? styles.inputError : ''}`} 
                required 
                disabled={isEditing}
              />
              {fieldErrors.email && <p className={styles.inputFieldErrorText}>{fieldErrors.email}</p>}
              {isEditing && !fieldErrors.email && <small className={styles.formTextMuted}>Email cannot be changed as it's tied to the login account.</small>}
            </div>
             <div className={styles.formGroup}>
              <label htmlFor="username">Display Username (Optional)</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                value={formData.username || ''} 
                onChange={handleChange} 
                className={`${styles.formControl} ${fieldErrors.username ? styles.inputError : ''}`} 
              />
              {fieldErrors.username && <p className={styles.inputFieldErrorText}>{fieldErrors.username}</p>}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber">Phone Number (Optional)</label>
              <input 
                type="tel" 
                id="phoneNumber" 
                name="phoneNumber" 
                value={formData.phoneNumber || ''} 
                onChange={handleChange} 
                className={`${styles.formControl} ${fieldErrors.phoneNumber ? styles.inputError : ''}`}
              />
              {fieldErrors.phoneNumber && <p className={styles.inputFieldErrorText}>{fieldErrors.phoneNumber}</p>}
            </div>

            <h4 className={styles.formSectionTitle}>Account Password</h4>
            <div className={styles.formGroup}>
              <label htmlFor="password">{isEditing ? "New Password (leave blank to keep current)" : "Password *"}</label>
              <div className={styles.passwordInputContainer}>
                <input 
                  type={passwordVisible ? "text" : "password"} 
                  id="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  className={`${styles.formControl} ${passwordInputShouldBeRed ? styles.inputError : ''}`} 
                  required={!isEditing} 
                  placeholder={isEditing ? "Enter new password" : "Min. 8 characters"} 
                  autoComplete="new-password" 
                />
                <button type="button" className={styles.eyeIcon} onClick={togglePasswordVisibility} aria-label="Toggle password visibility"><i className={passwordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i></button>
              </div>
              {passwordPolicyErrors.length > 0 && formData.password && (
                <ul className={styles.passwordPolicyErrorList}>
                  {passwordPolicyErrors.map((errorMsg, index) => (<li key={index}>{errorMsg}</li>))}
                </ul>
              )}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">{isEditing && !formData.password ? 'Confirm New Password' : 'Confirm Password *'}</label>
              <div className={styles.passwordInputContainer}>
                <input 
                  type={confirmPasswordVisible ? "text" : "password"} 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  className={`${styles.formControl} ${confirmPasswordInputShouldBeRed ? styles.inputError : ''}`} 
                  required={!isEditing || (!!formData.password)} 
                  placeholder={isEditing && !formData.password ? '' : 'Re-type password'} 
                  autoComplete="new-password"
                />
                <button type="button" className={styles.eyeIcon} onClick={toggleConfirmPasswordVisibility} aria-label="Toggle confirm password visibility"><i className={confirmPasswordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i></button>
              </div>
            </div>

            <h4 className={styles.formSectionTitle}>Role</h4>
            <div className={styles.formGroup}>
              <label htmlFor="role">Role *</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className={styles.formControl} required >
                {ADMIN_FORM_SELECTABLE_ROLES.map(roleOpt => (
                  <option key={roleOpt.value} value={roleOpt.value}>{roleOpt.label}</option>
                ))}
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

