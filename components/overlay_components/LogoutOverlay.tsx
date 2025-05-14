import React from 'react';
import styles from '../component_styles/LogoutOverlay.module.css';

interface LogoutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutOverlay: React.FC<LogoutOverlayProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlayContainer}>
      <div className={styles.backdrop} onClick={onClose}></div>
      <div className={styles.modalContent}>
        <h2 className={styles.title}>Logout Account</h2>
        
        <p className={styles.message}>
          Once logged out, you need to sign in again to access this website.
        </p>
        
        <div className={styles.buttonContainer}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className={styles.confirmButton} 
            onClick={onConfirm}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutOverlay;