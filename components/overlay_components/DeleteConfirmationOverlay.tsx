import React from 'react';
import styles from '../component_styles/ConfirmationOverlay.module.css';
import Portal from '../common/Portal';

interface DeleteConfirmationOverlayProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationOverlay: React.FC<DeleteConfirmationOverlayProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className={styles.overlay} onClick={onCancel}>
        <div className={styles.confirmationDialog} onClick={(e) => e.stopPropagation()}>
          <div className={styles.confirmationHeader}>
            <h3>{title}</h3>
            <button className={styles.closeButton} onClick={onCancel}>
              <i className="fa-regular fa-xmark"></i>
            </button>
          </div>
          
          <div className={styles.confirmationBody}>
            <div className={styles.warningIcon}>
              <i className="fa-regular fa-triangle-exclamation"></i>
            </div>
            <p>{message}</p>
          </div>
          
          <div className={styles.confirmationActions}>
            <button 
              className={styles.cancelButton} 
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              className={styles.confirmButton} 
              onClick={onConfirm}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default DeleteConfirmationOverlay;