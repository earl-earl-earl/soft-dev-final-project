"use client";

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from '../component_styles/NavigationProcess.module.css'; // Adjust the path as necessary

export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Reset loading state when the route changes
  useEffect(() => {
    // Start progress
    setIsVisible(true);
    setProgress(10);
    
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(60), 200);
    const timer3 = setTimeout(() => setProgress(80), 300);
    const timer4 = setTimeout(() => {
      setProgress(100);
      // Hide after completion
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(hideTimer);
    }, 400);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [pathname, searchParams]);
  
  if (!isVisible) return null;
  
  return (
    <div className={styles.progressContainer}>
      <div 
        className={styles.progressBar} 
        style={{ 
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
          transition: `width 0.4s ease-in-out, opacity 0.2s ease-in-out ${progress >= 100 ? '0.2s' : '0s'}`
        }}
      />
    </div>
  );
}