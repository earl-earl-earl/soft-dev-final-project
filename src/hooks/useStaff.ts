import { useState, useCallback, useEffect } from 'react';
import { StaffMember, StaffFormData } from '../types/staff';
import { fetchStaff, subscribeToStaffChanges } from '../utils/fetchStaff';
import { supabase } from '@/lib/supabaseClient';

export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Set up real-time subscription when component mounts
  useEffect(() => {
    console.log("Setting up staff subscription");
    
    // Subscribe to changes and update state when data changes
    const subscription = subscribeToStaffChanges((result) => {
      setStaff(result.staff);
      setIsLoading(false);
      setError(null);
    });
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const refreshStaff = useCallback(async (options?: { showLoading?: boolean, silentError?: boolean }) => {
    if (options?.showLoading !== false) {
      setIsLoading(true);
    }
    
    try {
      console.log("Manually refreshing staff data...");
      const result = await fetchStaff();
      setStaff(result.staff);
      setError(null);
      return { success: true, data: result.staff };
    } catch (err) {
      console.error("Error refreshing staff:", err);
      if (!options?.silentError) {
        setError(err instanceof Error ? err.message : "Failed to refresh staff");
      }
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    } finally {
      if (options?.showLoading !== false) {
        setIsLoading(false);
      }
    }
  }, []);
  
  const addStaff = useCallback(async (staffData: StaffFormData) => {
    try {
      setIsLoading(true);
      
      // Make a real API call to create a staff member
      const { /* data */ error: insertError } = await supabase
        .from('staff')
        .insert([{
          username: staffData.username,
          name: staffData.name,
          phone_number: staffData.phoneNumber,
          role: staffData.role,
          position: staffData.position,
          is_active: true
        }])
        .select();
      
      if (insertError) {
        throw new Error(insertError.message);
      }
      
      // The subscription will automatically update the UI with the new data
      setError(null);
      return { success: true };
    } catch (err) {
      setError('Failed to add staff member: ' + (err instanceof Error ? err.message : String(err)));
      console.error(err);
      return { success: false, error: 'Failed to add staff member' };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const updateStaff = useCallback(async (staffId: string, staffData: Partial<StaffFormData>) => {
    try {
      setIsLoading(true);
      
      // Only include fields that exist in the staff table
      const { error: updateError } = await supabase
        .from('staff')
        .update({
          name: staffData.name,
          username: staffData.username,
          phone_number: staffData.phoneNumber,
          position: staffData.position,
          // Don't include role as it's not in the staff table
        })
        .eq('user_id', staffId);
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      setError(null);
      return { success: true };
    } catch (err) {
      setError('Failed to update staff member: ' + (err instanceof Error ? err.message : String(err)));
      console.error(err);
      return { success: false, error: 'Failed to update staff member' };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const toggleStaffStatus = useCallback(async (staffId: string) => {
    try {
      setIsLoading(true);
      
      // Find the staff member to get the current status
      const staffMember = staff.find(member => member.id === staffId);
      if (!staffMember) {
        throw new Error('Staff member not found');
      }
      
      // Make a real API call to toggle the status
      const { error: updateError } = await supabase
        .from('staff')
        .update({
          is_active: !staffMember.isActive
        })
        .eq('user_id', staffId);
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      // The subscription will automatically update the UI with the new data
      setError(null);
      return { success: true };
    } catch (err) {
      setError('Failed to toggle staff status: ' + (err instanceof Error ? err.message : String(err)));
      console.error(err);
      return { success: false, error: 'Failed to toggle staff status' };
    } finally {
      setIsLoading(false);
    }
  }, [staff]);
  
  return {
    staff,
    isLoading,
    error,
    addStaff,
    updateStaff,
    toggleStaffStatus,
    refreshStaff
  };
}