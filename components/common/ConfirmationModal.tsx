import React from 'react';
import ReactDOM from 'react-dom';
import styles from '../component_styles/StaffTable.module.css';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  subMessage?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  subMessage,
  confirmLabel,
  onConfirm,
  onCancel,
  isDanger = false
}) => {
  if (!isOpen) return null;
  
  return ReactDOM.createPortal(
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles.confirmationModal}`}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className={styles.closeButton} onClick={onCancel}>
            <i className="fa-regular fa-times"></i>
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.warningIcon}>
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <p className={styles.confirmationText}>{message}</p>
          {subMessage && <p className={styles.confirmationSubtext}>{subMessage}</p>}
        </div>
        <div className={styles.modalFooter}>
          <button 
            type="button" 
            className={styles.secondaryButton} 
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className={`${styles.primaryButton} ${isDanger ? styles.dangerButton : ''}`} 
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;