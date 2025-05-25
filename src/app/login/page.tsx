"use client";

import styles from "./page.module.css"; // Ensure this path is correct
import Image from "next/image";
import { useState, FormEvent } from "react"; // Added FormEvent for type safety
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Ensure this path is correct

export default function LoginPage() { // Or export default function Home() if that's your file's export
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Unified error state for better display logic
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; }>({});

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const validateInputs = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) { // Supabase default min length
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setFieldErrors(errors);
    // Set a general error message if specific field errors exist
    if (!isValid) {
        setErrorMessage(errors.email || errors.password || "Please correct the highlighted fields.");
    }
    return isValid;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => { // Typed event
    e.preventDefault();
    setErrorMessage(null); // Clear previous general errors
    setFieldErrors({});    // Clear previous field errors

    if (!validateInputs()) {
      return; // Validation will set errorMessage via setFieldErrors effect or directly
    }

    setIsLoading(true);

    try {
      // Step 1: Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(), // Send trimmed email
        password, // Password is not trimmed
      });

      if (authError) {
        console.error("Supabase Auth Error:", authError.message);
        if (authError.message.includes("Invalid login credentials")) {
          setErrorMessage("Incorrect email or password. Please try again.");
        } else if (authError.message.includes("Email not confirmed")) {
          setErrorMessage("Please verify your email address before logging in.");
        } else if (authError.message.toLowerCase().includes("rate limit")) {
          setErrorMessage("Too many login attempts. Please try again later.");
        } else {
          setErrorMessage(authError.message || "Authentication failed.");
        }
        setIsLoading(false);
        return;
      }

      // Step 2: If Supabase Auth is successful, check our custom 'users' table for 'is_active'
      if (authData?.user) {
        console.log("Supabase Auth successful, user ID:", authData.user.id);
        const { data: userData, error: userTableError } = await supabase
          .from('users')
          .select('is_active, role') // Select role as well for potential future use or logging
          .eq('id', authData.user.id)
          .single();

        if (userTableError) {
          console.error("Error fetching user details from 'users' table:", userTableError);
          setErrorMessage("Login error: Could not verify account status. Please contact support.");
          await supabase.auth.signOut(); 
          setIsLoading(false);
          return;
        }

        if (!userData) {
            console.error("User profile not found in 'users' table for auth ID:", authData.user.id);
            setErrorMessage("Login error: User profile not found. Please contact support.");
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
        }
        
        if (!userData.is_active) {
          console.log("User account is inactive (users.is_active is false). ID:", authData.user.id);
          setErrorMessage("Your account has been deactivated. Please contact support.");
          await supabase.auth.signOut(); 
          setIsLoading(false);
          return;
        }

        console.log("All checks passed. User is active. Role:", userData.role, "Navigating to dashboard...");
        router.push("/dashboard"); 
        // setIsLoading will be false in finally, no need to set here if navigating away
      } else {
        // This case should ideally be caught by authError, but as a safeguard
        console.error("Login failed: No user data returned from Supabase authentication, but no authError received.");
        setErrorMessage("Login failed: An unexpected authentication issue occurred.");
        setIsLoading(false);
      }

    } catch (err: any) { // Catch network errors or other unexpected issues during the process
      setErrorMessage("Unable to connect. Please check your internet and try again.");
      console.error("Login process - unhandled catch error:", err);
      setIsLoading(false); // Ensure loading is stopped
    } 
    // finally { // setIsLoading(false) can be here if not navigating away immediately
    //   setIsLoading(false);
    // }
  };

  return (
    <div className={styles.page}>
      <header className={styles.logoContainer}>
        <Image
          src="/images/logor.png" // Ensure this path is correct in your public folder
          alt="Cabas-an Cold Springs Admin"
          className={styles.logo}
          width={50}
          height={50}
          priority // Good for LCP
        />
        <h1 className={styles.title}>Cabas-an Cold Springs</h1>
      </header>

      <main className={styles.content}>
        <div className={styles.welcomeTitle}>
          <h2 className={styles.welcome}>Welcome back</h2>
          <p>Sign in to access the administrative dashboard</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form} noValidate> {/* Added noValidate */}
          <div className={styles.inputDiv}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email" // Good for accessibility and testing
              placeholder="Enter your email"
              required // HTML5 validation, but custom validation takes precedence
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors(prev => ({...prev, email: undefined}));
                if (errorMessage && errorMessage === fieldErrors.email) setErrorMessage(null);
              }}
              className={`${styles.formControl} ${fieldErrors.email ? styles.inputError : ""}`} // Assuming formControl is a general input style
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
          </div>

          <div className={styles.inputDiv}>
            <div className={styles.passwordLabelContainer}>
              <label htmlFor="password">Password</label>
              {/* TODO: Implement forgot password functionality if needed */}
              <a href="#" className={styles.forgotPassword} onClick={(e) => e.preventDefault()}> 
                Forgot password?
              </a>
            </div>

            <div className={styles.passwordContainer}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors(prev => ({...prev, password: undefined}));
                  if (errorMessage && errorMessage === fieldErrors.password) setErrorMessage(null);
                }}
                className={`${styles.formControl} ${fieldErrors.password ? styles.inputError : ""}`}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
              />
              <i
                className={`fa-regular fa${
                  showPassword ? "-eye-slash" : "-eye"
                }`}
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1} // Remove from tab order if icon itself isn't meant to be focused
              />
            </div>

          </div>

          {/* Display a single, prominent error message */}
          {errorMessage && (
            <p id="form-error" className={styles.singleError} role="alert">
              • {errorMessage}
            </p>
          )}
          {/* Or, if you want to show field-specific errors separately under inputs: */}
          {/* {fieldErrors.email && <p id="email-error" className={styles.fieldSpecificError}>{fieldErrors.email}</p>} */}
          {/* {fieldErrors.password && <p id="password-error" className={styles.fieldSpecificError}>{fieldErrors.password}</p>} */}


          <button
            type="submit"
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <i className="fa-solid fa-spinner fa-spin"></i> // Consistent spinner
            ) : (
              "Login"
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
