import { useState, useCallback, useEffect } from 'react';
import { AdminMember, AdminFormData } from '../types/admin';
import { fetchAdmins, subscribeToAdminChanges } from '../utils/fetchAdmins';

export function useAdmins() {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Set up real-time subscription when component mounts
  useEffect(() => {
    const subscription = subscribeToAdminChanges((result) => {
      setAdmins(result.admins);
      setIsLoading(false);
      setError(null);
    });
    
    // Clean up subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const addAdmin = useCallback(async (adminData: AdminFormData) => {
    try {
      // Make API call to create an admin
      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add admin');
      }
      
      // Admins will be updated via subscription
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add admin' };
    }
  }, []);
  
  const updateAdmin = useCallback(async (id: string, adminData: Partial<AdminFormData>) => {
    try {
      // Make API call to update an admin
      const response = await fetch(`/api/admins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update admin');
      }
      
      // Admins will be updated via subscription
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update admin' };
    }
  }, []);
  
  const toggleAdminStatus = useCallback(async (id: string) => {
    try {
      // Find current status
      const admin = admins.find(a => a.id === id);
      if (!admin) {
        throw new Error('Admin not found');
      }
      
      // Make API call to toggle admin status
      const response = await fetch(`/api/admins/${id}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !admin.isActive })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle admin status');
      }
      
      // Admins will be updated via subscription
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to toggle admin status' };
    }
  }, [admins]);
  
  return {
    admins,
    isLoading,
    error,
    addAdmin,
    updateAdmin,
    toggleAdminStatus
  };
}