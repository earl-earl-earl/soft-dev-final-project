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
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({
    email: undefined,
    password: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const validateInputs = () => {
    const errors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Get the most critical error message to display
  const getErrorMessage = () => {
    // First priority: server/auth errors
    if (error) return error;
    
    // Second priority: email errors
    if (fieldErrors.email) return fieldErrors.email;
    
    // Third priority: password errors
    if (fieldErrors.password) return fieldErrors.password;
    
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({
      email: undefined,
      password: undefined,
    });

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          setError("Incorrect email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please verify your email address before logging in.");
        } else if (error.message.includes("rate limit")) {
          setError("Too many login attempts. Please try again later.");
        } else {
          setError(error.message);
        }
      } else {
        router.push("/dashboard"); // redirect after successful login
      }
    } catch (err) {
      setError(
        "Unable to connect to the server. Please check your internet connection and try again."
      );
      console.error(err);
    } finally {
      setIsLoading(false);
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
          <p>Sign in to access the administrative dashboard</p>
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
              className={fieldErrors.email ? styles.inputError : ""}
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
                className={fieldErrors.password ? styles.inputError : ""}
              />
              <i
                className={`fa-regular fa${
                  showPassword ? "-eye-slash" : "-eye"
                }`}
                onClick={togglePasswordVisibility}
              ></i>
            </div>

          </div>

          {/* Single small error message display */}
          {getErrorMessage() && (
            <p className={styles.singleError}>
              • {getErrorMessage()}
            </p>
          )}

          <button
            type="submit"
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? (
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
