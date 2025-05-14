"use client"

import styles from "./page.module.css";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Handle error
        let errorMessage = result.error;
        
        // Translate generic NextAuth errors to more helpful messages
        if (result.error === "CredentialsSignin") {
          errorMessage = "Invalid username or password";
        }
        
        throw new Error(errorMessage);
      }

      // Successful login
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred during login";
      setError(errorMessage);
    } finally {
      setLoading(false);
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
          <p>Sign in to access your admin dashboard</p>
        </div>
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputDiv}>
            <label htmlFor="username">Username</label>
            <input 
              type="text"
              id="username" 
              placeholder="Enter your username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <i 
                className={`fa-regular fa${showPassword ? "-eye-slash" : "-eye"}`} 
                onClick={togglePasswordVisibility}
              ></i>
            </div>
          </div>
          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? (
              <i className="fa-solid fa-spinner-third fa-spin"></i>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
