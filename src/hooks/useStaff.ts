// src/hooks/useStaff.ts
import { useState, useCallback, useEffect } from 'react';
import { StaffMember, StaffFormData } from '../types/staff';
import { fetchStaff, subscribeToStaffChanges, FetchStaffResult } from '../utils/fetchStaff';

interface MutationResult {
  success: boolean;
  error?: string;
  formErrors?: Record<string, string>; // For field-specific errors like "email taken"
  data?: StaffMember; 
}

export interface UseStaffReturn {
  staff: StaffMember[];
  isLoading: boolean;
  error: string | null;
  formErrors: Record<string, string>;
  addStaff: (staffData: StaffFormData) => Promise<MutationResult>; 
  updateStaff: (staffId: string, staffData: Partial<StaffFormData>) => Promise<MutationResult>;
  toggleStaffStatus: (staffId: string, currentIsActive: boolean) => Promise<MutationResult>;
  refreshStaff: (options?: { showLoading?: boolean; silentError?: boolean }) => Promise<Pick<FetchStaffResult, 'error'> & {success: boolean, data?: StaffMember[]}>;
  clearError: () => void;
}

export function useStaff(): UseStaffReturn {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const clearError = useCallback(() => {
    setError(null);
    setFormErrors({});
  }, []);

  const refreshStaff = useCallback(async (options?: { showLoading?: boolean; silentError?: boolean }) => {
    if (options?.showLoading !== false) setIsLoading(true);
    clearError();
    try {
      const result = await fetchStaff(); // fetchStaff GETs from an API or directly
      if (result.error && !options?.silentError) {
        setError(result.error); setStaff([]);
        return { success: false, error: result.error };
      }
      setStaff(result.staff || []);
      return { success: true, data: result.staff || [] };
    } catch (err: any) {
      if (!options?.silentError) setError(err.message || "Failed to refresh staff");
      setStaff([]);
      return { success: false, error: err.message || "Unknown error" };
    } finally {
      if (options?.showLoading !== false) setIsLoading(false);
    }
  }, [clearError]);

  useEffect(() => {
    refreshStaff();
    const { unsubscribe } = subscribeToStaffChanges((result) => {
      if (result.staff) setStaff(result.staff);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [refreshStaff]);

  const addStaff = useCallback(async (staffData: StaffFormData): Promise<MutationResult> => {
    setIsLoading(true);
    clearError();
    try {
      const response = await fetch('/api/staff', { // <<<< CALL BACKEND API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      const responseData = await response.json();

      if (!response.ok) {
        setFormErrors(responseData.formErrors || {}); // Expecting { field: 'message' }
        throw new Error(responseData.error || 'Server error adding staff.');
      }
      await refreshStaff({ showLoading: false });
      return { success: true, data: responseData as StaffMember };
    } catch (err: any) {
      setError(err.message || 'Failed to add staff member.');
      return { success: false, error: err.message, formErrors };
    } finally {
      setIsLoading(false);
    }
  }, [refreshStaff, clearError, formErrors]); // Added formErrors to dependency array

  const updateStaff = useCallback(async (staffId: string, staffData: Partial<StaffFormData>): Promise<MutationResult> => {
    setIsLoading(true);
    clearError();
    try {
      const response = await fetch(`/api/staff/${staffId}`, { // <<<< CALL BACKEND API
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      const responseData = await response.json();

      if (!response.ok) {
        setFormErrors(responseData.formErrors || {});
        throw new Error(responseData.error || 'Server error updating staff.');
      }
      await refreshStaff({ showLoading: false });
      return { success: true, data: responseData as StaffMember };
    } catch (err: any) {
      setError(err.message || 'Failed to update staff member.');
      return { success: false, error: err.message, formErrors };
    } finally {
      setIsLoading(false);
    }
  }, [refreshStaff, clearError, formErrors]); // Added formErrors

  const toggleStaffStatus = useCallback(async (staffId: string, currentIsActive: boolean): Promise<MutationResult> => {
    setIsLoading(true);
    clearError();
    try {
      // should update 'users.is_active' and potentially 'auth.users' if reacvtivating/deactivating
      const response = await fetch(`/api/staff/${staffId}/status`, { // <<<< DEDICATED API for status
        method: 'PATCH', // Or PUT
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentIsActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle staff status via API.');
      }
      await refreshStaff({ showLoading: false });
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to toggle staff status.');
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshStaff, clearError]);

  return {
    staff, isLoading, error, formErrors,
    addStaff, updateStaff, toggleStaffStatus,
    refreshStaff, clearError,
  };
}