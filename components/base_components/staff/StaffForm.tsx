// StaffForm.tsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from '../../component_styles/StaffFeature.module.css'; // Assuming this is the correct path
import { StaffFormData, POSITIONS, ROLES } from '../../../src/types/staff';

interface StaffFormProps {
  isOpen: boolean;
  initialData?: Partial<StaffFormData>; 
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (data: StaffFormData) => void;
}

// Password validation helper
const validatePasswordPolicy = (password: string): { isValid: boolean; messages: string[] } => {
  const messages: string[] = [];
  if (password.length < 8) {
    messages.push("Be at least 8 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    messages.push("Contain at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    messages.push("Contain at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    messages.push("Contain at least one number.");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    messages.push("Contain at least one special character (e.g., !@#$%^&*).");
  }
  return { isValid: messages.length === 0, messages };
};

// Regex for validations
const fullNameRegex = /^[a-zA-Z\s'-]*$/; 
const usernameRegex = /^[a-zA-Z0-9]*$/;
const emailRegex = /^\S+@\S+\.\S+$/;
const phoneRegex = /^[0-9+\-()\s]*$/; // Allows digits, +, -, (), spaces


const StaffForm: React.FC<StaffFormProps> = ({
  isOpen,
  initialData = {}, 
  isEditing,
  onClose,
  onSubmit
}) => {
  const createInitialFormData = (): StaffFormData => ({
    name: initialData.name || '',
    email: initialData.email || '',
    username: initialData.username || '',
    phoneNumber: initialData.phoneNumber || '',
    password: '', 
    confirmPassword: '',
    role: initialData.role || (ROLES.length > 0 ? ROLES[0] : 'Staff'), // Default to first role or 'Staff'
    isAdmin: initialData.role === 'Admin' || initialData.isAdmin || false,
    // position: initialData.position || (POSITIONS.length > 0 ? POSITIONS[0] : ''),
  });

  const [formData, setFormData] = useState<StaffFormData>(createInitialFormData());
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null); // General form error
  const [passwordPolicyErrors, setPasswordPolicyErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); // Field-specific errors


  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormData());
      setFormError(null);
      setPasswordPolicyErrors([]);
      setFieldErrors({}); // Reset field-specific errors
      setPasswordVisible(false);
      setConfirmPasswordVisible(false);
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'role') {
        updated.isAdmin = value === 'Admin'; 
      }
      return updated;
    });

    // Clear general form error and relevant field error on input change
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

    // Password policy check during typing
    if (name === 'password') {
      if (value.length > 0) {
        const policyCheck = validatePasswordPolicy(value);
        setPasswordPolicyErrors(policyCheck.messages);
      } else {
        setPasswordPolicyErrors([]);
      }
    }

    // Field-specific validations during typing
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
    setFormError(null); // Reset general form error
    
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
    
    setFieldErrors(currentSubmitFieldErrors); // Update state with any new field errors

    // 5. Password validations
    const isPasswordBeingSet = !!formData.password || !isEditing;
    let tempPasswordPolicyErrors: string[] = []; 

    if (isPasswordBeingSet) {
        if (!formData.password) { 
            setFormError("Password is required for new staff or when changing password.");
            validationFailed = true;
        } else {
            const policyCheck = validatePasswordPolicy(formData.password);
            if (!policyCheck.isValid) {
                tempPasswordPolicyErrors = policyCheck.messages;
                setFormError("Password does not meet security requirements.");
                validationFailed = true;
            }
            if (formData.password !== formData.confirmPassword) {
              setFormError("Passwords do not match.");
              validationFailed = true;
            }
        }
    }
    setPasswordPolicyErrors(tempPasswordPolicyErrors); // Update password policy error list for display

    if (validationFailed) {
        if (!formError && Object.keys(currentSubmitFieldErrors).length > 0) {
            setFormError("Please correct the errors highlighted below.");
        }
        return; // Prevent submission
    }


    const dataToSubmit: StaffFormData = { ...formData };
    if (isEditing && !formData.password) {
      delete dataToSubmit.password;
      delete dataToSubmit.confirmPassword;
    }
    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  // Determine if password input should have an error border based on general form error or policy list
  const passwordInputShouldBeRed = 
    (passwordPolicyErrors.length > 0 && formData.password) || 
    formError === "Password is required for new staff or when changing password." ||
    formError === "Password does not meet security requirements." ||
    formError === "Passwords do not match.";

  // Determine if confirm password input should have an error border
  const confirmPasswordInputShouldBeRed = formError === "Passwords do not match.";


  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{isEditing ? 'Edit Staff User' : 'Add New Staff User'}</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}><i className="fa-regular fa-times"></i></button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.modalBody}>
            {formError && <p className={styles.formErrorMessage}>{formError}</p>}
            
            <h4 className={styles.formSectionTitle}>User Information</h4>
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
              {isEditing && !fieldErrors.email && <small className={styles.formTextMuted}>Email cannot be changed as it's tied to the authentication account.</small>}
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
              <label htmlFor="password">
                {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
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
                  {passwordPolicyErrors.map((errorMsg, index) => (
                    <li key={index}>{errorMsg}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">
                {isEditing && !formData.password ? 'Confirm New Password' : 'Confirm Password *'}
              </label>
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
              <select id="role" name="role" value={formData.role} onChange={handleChange} className={styles.formControl} required>
                {(ROLES as readonly ('Staff' | 'Admin')[]).map(role => (<option key={role} value={role}>{role}</option>))}
              </select>
            </div>
            {/* <div className={styles.formGroup}>
              <label htmlFor="position">Position *</label>
              <select id="position" name="position" value={formData.position} onChange={handleChange} className={styles.formControl} required>
                <option value="">Select Position</option>
                {POSITIONS.map(position => (<option key={position} value={position}>{position}</option>))}
              </select>
            </div> */}
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.primaryButton}>{isEditing ? 'Save Changes' : 'Add Staff User'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default StaffForm;