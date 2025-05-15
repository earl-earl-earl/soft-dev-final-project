"use client";

import React, { useState } from "react";
import styles from "../component_styles/LogoutOverlay.module.css";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface LogoutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogoutOverlay: React.FC<LogoutOverlayProps> = ({ isOpen, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogout = async () => {
    setIsProcessing(true);
    const { error } = await supabase.auth.signOut();
    setIsProcessing(false);

    if (!error) {
      router.push("/login");
    } else {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <div className={styles.overlayContainer}>
      <div className={styles.backdrop} onClick={onClose}></div>
      <div className={styles.modalContent}>
        <h2 className={styles.title}>Logout Account</h2>
        <p className={styles.message}>
          Once logged out, you’ll need to sign in again to access the site.
        </p>

        <div className={styles.buttonContainer}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleLogout}
            disabled={isProcessing}
          >
            {isProcessing ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutOverlay;
