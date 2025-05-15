"use client";

import styles from "./page.module.css";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // adjust import path if needed

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard"); // redirect after successful login
    }
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

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputDiv}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <i
                className={`fa-regular fa${
                  showPassword ? "-eye-slash" : "-eye"
                }`}
                onClick={togglePasswordVisibility}
              ></i>
            </div>

            <div className={styles.notice}>
              <p>• Lorem ipsum dolor sit amet consectetur.</p>
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.loginButton}>
            Login
          </button>
        </form>
      </main>
    </div>
  );
}
