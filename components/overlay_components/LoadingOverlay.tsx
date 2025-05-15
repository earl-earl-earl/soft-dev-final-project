
"use client";

import { useLoading } from '@/contexts/LoadingContext';
import styles from '../component_styles/LoadingOverlay.module.css';

export default function LoadingOverlay() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className={styles.overlayContainer}>
      <div className={styles.spinner}>
        <i className="fa-regular fa-spinner-third fa-spin"></i>
      </div>
    </div>
  );
}