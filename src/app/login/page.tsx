"use client"

import styles from "./page.module.css";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className={styles.page}>
      <header className={styles.logoContainer}>
        <Image
          src="/images/logor.png"
          alt="Cabas-an Cold Springs Admin"
          className={styles.logo}
          width={50}
          height={50}
        />
        <h1 className={styles.title}>Cabas-an Cold Springs</h1>
      </header>
      <main className={styles.content}>
        <div className={styles.welcomeTitle}>
          <h2 className={styles.welcome}>Welcome back</h2>
          <p>Some subtitle text. Lorem ipsum dolor sit amet.</p>
        </div>
        <form action="post" className={styles.form}>
          <div className={styles.inputDiv}>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" placeholder="Enter your email" required />
          </div>
          <div className={styles.inputDiv}>
            <div className={styles.passwordLabelContainer}>
              <label htmlFor="password">Password</label>
              <a href="#" className={styles.forgotPassword}>
                Forgot password?
              </a>
            </div>
            <div className={styles.passwordContainer}>
              <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Enter your password"
            />
            <i className={`fa-regular fa${showPassword ? "-eye-slash" : "-eye"}`} onClick={togglePasswordVisibility}></i>
            </div>
            <div className={styles.notice}>
              <p>• Lorem ipsum dolor sit amet consectetur.</p>
            </div>
          </div>
          <button className={styles.loginButton}>Login</button>
        </form>
      </main>
    </div>
  );
}
