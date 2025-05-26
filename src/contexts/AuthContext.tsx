"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/lib/supabaseClient";
// import { User } from "@supabase/supabase-js";
import { useRouter } from 'next/navigation';

// Define the type of user data we'll store in context
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string | null;
  username: string | null;
  isActive: boolean;
}

// Define the context shape
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  isSuperAdmin: false,
  login: async () => ({ success: false, error: "Context not initialized" }),
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Computed properties
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  // Function to refresh user data from the database
  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      const authUser = session.user;
      
      // Get user data from your custom tables
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', authUser.id)
        .single();
      
      if (userError || !userData) {
        console.error("Failed to fetch user data:", userError?.message);
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Get staff data if applicable
      const { data: staffData } = await supabase
        .from('staff')
        .select('name, username')
        .eq('user_id', authUser.id)
        .single();
      
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        role: userData.role,
        name: staffData?.name || authUser.user_metadata?.full_name || null,
        username: staffData?.username || authUser.user_metadata?.display_username || null,
        isActive: userData.is_active
      });
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        console.error("Authentication error:", authError.message);
        return { 
          success: false, 
          error: authError.message.includes("Invalid login credentials") 
            ? "Incorrect email or password. Please try again." 
            : authError.message 
        };
      }

      if (!data.user) {
        return { success: false, error: "Failed to authenticate user" };
      }

      // Verify user is active in your custom table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_active, role')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        return { success: false, error: "User profile not found" };
      }

      if (!userData.is_active) {
        await supabase.auth.signOut();
        return { success: false, error: "Your account has been deactivated. Please contact support." };
      }

      // Refresh user will be called by the auth state change listener
      return { success: true };
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message || "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up auth state listener
  useEffect(() => {
    setIsLoading(true);
    
    // Check session on initial load
    refreshUser();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          await refreshUser();
        } else if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setIsLoading(false);
          if (window.location.pathname !== '/login') {
            router.push('/login');
          }
        }
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      isAdmin,
      isSuperAdmin,
      login,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;