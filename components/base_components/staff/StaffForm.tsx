// StaffForm.tsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from '../../component_styles/StaffFeature.module.css';
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
    role: initialData.role || ROLES[0], 
    isAdmin: initialData.role === 'Admin' || initialData.isAdmin || false,
    position: initialData.position || (POSITIONS.length > 0 ? POSITIONS[0] : ''),
  });

  const [formData, setFormData] = useState<StaffFormData>(createInitialFormData());
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordPolicyErrors, setPasswordPolicyErrors] = useState<string[]>([]);


  useEffect(() => {
    if (isOpen) {
      setFormData(createInitialFormData());
      setFormError(null);
      setPasswordPolicyErrors([]); // Reset password policy errors
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
      // If password field is changing, re-validate policy for immediate feedback
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
        setFormError("A valid email address is required.");
        return;
    }

    // Password is required for new staff OR if it's being changed during edit
    const isPasswordBeingSet = !!formData.password || !isEditing;

    if (isPasswordBeingSet) {
        if (!formData.password) {
            setFormError("Password is required for new staff or when changing password.");
            return;
        }
        const policyCheck = validatePasswordPolicy(formData.password);
        if (!policyCheck.isValid) {
            setPasswordPolicyErrors(policyCheck.messages);
            setFormError("Password does not meet security requirements.");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
          setFormError("Passwords do not match."); 
          return;
        }
    }


    const dataToSubmit: StaffFormData = { ...formData };
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
          <h3>{isEditing ? 'Edit Staff User' : 'Add New Staff User'}</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}><i className="fa-regular fa-times"></i></button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.modalBody}>
            {formError && <p className={styles.formErrorMessage}>{formError}</p>}
            
            <h4 className={styles.formSectionTitle}>User Information</h4>
            {/* ... Name, Email, Username, Phone Number fields ... */}
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name *</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={styles.formControl} required />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address (for login) *</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={styles.formControl} required disabled={isEditing} />
              {isEditing && <small className={styles.formTextMuted}>Email cannot be changed as it's tied to the authentication account.</small>}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="username">Display Username (Optional)</label>
              <input type="text" id="username" name="username" value={formData.username || ''} onChange={handleChange} className={styles.formControl} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber">Phone Number (Optional)</label>
              <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} className={styles.formControl} />
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
                  className={`${styles.formControl} ${passwordPolicyErrors.length > 0 && formData.password ? styles.inputError : ''}`}
                  required={!isEditing} 
                  placeholder={isEditing ? "Enter new password" : "Min. 8 characters"} 
                  autoComplete="new-password"
                />
                <button type="button" className={styles.eyeIcon} onClick={togglePasswordVisibility} aria-label="Toggle password visibility"><i className={passwordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i></button>
              </div>
              {/* Display Password Policy Errors */}
              {passwordPolicyErrors.length > 0 && formData.password && ( // Only show if password has been typed
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
                  className={styles.formControl} 
                  required={!isEditing || (!!formData.password)} 
                  placeholder={isEditing && !formData.password ? '' : 'Re-type password'} 
                  autoComplete="new-password"
                />
                <button type="button" className={styles.eyeIcon} onClick={toggleConfirmPasswordVisibility} aria-label="Toggle confirm password visibility"><i className={confirmPasswordVisible ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i></button>
              </div>
            </div>

            <h4 className={styles.formSectionTitle}>Role & Position</h4>
            {/* ... Role and Position select fields ... */}
            <div className={styles.formGroup}>
              <label htmlFor="role">Role *</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className={styles.formControl} required>
                {(ROLES as readonly ('Staff' | 'Admin')[]).map(role => (<option key={role} value={role}>{role}</option>))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="position">Position *</label>
              <select id="position" name="position" value={formData.position} onChange={handleChange} className={styles.formControl} required>
                <option value="">Select Position</option>
                {POSITIONS.map(position => (<option key={position} value={position}>{position}</option>))}
              </select>
            </div>
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