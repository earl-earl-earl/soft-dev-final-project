import React, { useState } from 'react';
import styles from '../component_styles/ExportOverlay.module.css';

interface ExportOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string) => void;
}

const ExportOverlay: React.FC<ExportOverlayProps> = ({
  isOpen,
  onClose,
  onExport
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  if (!isOpen) return null;

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(format);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFormat) {
      onExport(selectedFormat);
      onClose();
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.exportOverlayContent}>
        <div className={styles.overlayHeader}>
          <h2>Export</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fa-regular fa-xmark"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.exportForm}>
          <div className={styles.exportSection}>
            <div className={styles.exportOptions}>
              <div 
                className={`${styles.exportOption} ${selectedFormat === 'pdf' ? styles.selected : ''}`}
                onClick={() => handleFormatSelect('pdf')}
              >
                <div className={styles.exportIcon}>
                  <i className="fa-regular fa-file-pdf"></i>
                </div>
                <span className={styles.exportText}>Export as PDF</span>
              </div>
              
              <div 
                className={`${styles.exportOption} ${selectedFormat === 'csv' ? styles.selected : ''}`}
                onClick={() => handleFormatSelect('csv')}
              >
                <div className={styles.exportIcon}>
                  <i className="fa-regular fa-file-excel"></i>
                </div>
                <span className={styles.exportText}>Export as CSV</span>
              </div>
            </div>
          </div>

          <div className={styles.exportActions}>
            <button 
              type="submit" 
              className={styles.exportButton}
              disabled={!selectedFormat}
            >
              Export
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportOverlay;