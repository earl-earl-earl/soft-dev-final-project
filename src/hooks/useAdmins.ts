// src/hooks/useAdmins.ts
import { useState, useCallback, useEffect } from 'react';
import { AdminMember, AdminFormData } from '../types/admin';
import { fetchAdmins as fetchAdminsUtil, FetchAdminsResult, AdminLookup } from '../utils/fetchAdmins'; 
// No direct supabase client needed here if all go through API
// import { supabase } from '../lib/supabaseClient';

// Assuming subscribeToAdminChanges is also in fetchAdmins.ts and uses fetchAdminsUtil
import { subscribeToAdminChanges } from '../utils/fetchAdmins'; 

interface MutationResult {
  success: boolean;
  error?: string;
  formErrors?: Record<string, string>;
  data?: AdminMember; 
}

export interface UseAdminsReturn {
  admins: AdminMember[];
  isLoading: boolean;
  error: string | null;
  formErrors: Record<string, string>;
  addAdmin: (adminData: AdminFormData) => Promise<MutationResult>; 
  updateAdmin: (adminId: string, adminData: Partial<AdminFormData>) => Promise<MutationResult>;
  toggleAdminStatus: (adminId: string, currentIsActive: boolean) => Promise<MutationResult>;
  refreshAdmins: (options?: { showLoading?: boolean; silentError?: boolean }) => Promise<Pick<FetchAdminsResult, 'error' | 'admins'> & {success: boolean}>;
  clearError: () => void;
}

export function useAdmins(): UseAdminsReturn {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearError = useCallback(() => {
    setError(null);
    setFormErrors({});
  }, []);

  const refreshAdmins = useCallback(async (options?: { showLoading?: boolean; silentError?: boolean }) => {
    if (options?.showLoading !== false) setIsLoading(true);
    clearError();
    try {
      const result = await fetchAdminsUtil(); // Uses the imported utility
      if (result.error && !options?.silentError) {
        setError(result.error); 
        setAdmins([]);
        return { success: false, error: result.error, admins: [] };
      }
      setAdmins(result.admins || []);
      // adminLookup is not directly used in this hook's state but returned by fetchAdminsUtil
      return { success: true, admins: result.admins || [], error: undefined }; // Always include both admins and error
    } catch (err: any) {
      if (!options?.silentError) setError(err.message || "Failed to refresh admins");
      setAdmins([]);
      return { success: false, error: err.message || "Unknown error", admins: [] };
    } finally {
      if (options?.showLoading !== false) setIsLoading(false);
    }
  }, [clearError]);

  useEffect(() => {
    refreshAdmins();
    // Assuming subscribeToAdminChanges uses fetchAdminsUtil internally for refetch
    const { unsubscribe } = subscribeToAdminChanges((result) => {
      if (result.admins) {
        setAdmins(result.admins);
      }
      if (result.error && !error) {
        // setError(result.error);
      }
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [refreshAdmins]);

  const addAdmin = useCallback(async (adminData: AdminFormData): Promise<MutationResult> => {
    setIsLoading(true);
    clearError();
    try {
      console.log("useAdmins: addAdmin - Calling POST /api/admin with data:", adminData);
      const response = await fetch('/api/admin', { // Calls backend API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData),
      });
      const responseData = await response.json();
      console.log("useAdmins: addAdmin - API Response:", response.status, responseData);

      if (!response.ok) {
        setFormErrors(responseData.formErrors || {}); 
        const errorMessage = responseData.error || `Server error: ${response.status}`;
        setError(errorMessage);
        return { success: false, error: errorMessage, formErrors: responseData.formErrors || {} };
      }
      await refreshAdmins({ showLoading: false });
      return { success: true, data: responseData as AdminMember };
    } catch (err: any) { 
      const message = err.message || 'Failed to add admin due to a client-side or network error.';
      console.error("useAdmins: addAdmin - CATCH block error:", err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshAdmins, clearError]);

  const updateAdmin = useCallback(async (adminId: string, adminData: Partial<AdminFormData>): Promise<MutationResult> => {
    setIsLoading(true);
    clearError();
    try {
      const payload = {...adminData};
      if (payload.password === '') delete payload.password;
      if (payload.confirmPassword === '') delete payload.confirmPassword;

      console.log(`useAdmins: updateAdmin - Calling PUT /api/admin/${adminId} with payload:`, payload);
      const response = await fetch(`/api/admin/${adminId}`, { // Calls backend API
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      console.log("useAdmins: updateAdmin - API Response:", response.status, responseData);

      if (!response.ok) {
        setFormErrors(responseData.formErrors || {});
        const errorMessage = responseData.error || `Server error: ${response.status}`;
        setError(errorMessage);
        return { success: false, error: errorMessage, formErrors: responseData.formErrors || {} };
      }
      await refreshAdmins({ showLoading: false });
      return { success: true, data: responseData as AdminMember };
    } catch (err: any) {
      const message = err.message || 'Failed to update admin due to a client-side or network error.';
      console.error("useAdmins: updateAdmin - CATCH block error:", err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshAdmins, clearError]);

  const toggleAdminStatus = useCallback(async (adminId: string, currentIsActive: boolean): Promise<MutationResult> => {
    setIsLoading(true);
    clearError();
    try {
      console.log(`useAdmins: toggleAdminStatus - Calling PATCH /api/admin/${adminId}/status`);
      const response = await fetch(`/api/admin/${adminId}/status`, { // Dedicated API
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentIsActive }),
      });
      // const responseData = await response.json(); // Not strictly needed if only expecting success/failure message
      console.log("useAdmins: toggleAdminStatus - API Response status:", response.status);


      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || `Server error: ${response.status}`);
      }
      await refreshAdmins({ showLoading: false });
      return { success: true };
    } catch (err: any) {
      const message = err.message || 'Failed to toggle admin status.';
      console.error("useAdmins: toggleAdminStatus - CATCH block error:", err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshAdmins, clearError]);

  return {
    admins,
    isLoading,
    error,
    formErrors,
    addAdmin,
    updateAdmin,
    toggleAdminStatus,
    refreshAdmins,
    clearError,
  };
}