
"use client";

import styles from '../component_styles/LoadingOverlay.module.css';

export default function LoadingOverlay() {

  return (
    <div className={styles.overlayContainer}>
      <div className={styles.spinner}>
        <i className="fa-regular fa-spinner-third fa-spin"></i>
      </div>
    </div>
  );
}