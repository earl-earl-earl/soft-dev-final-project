import { useState, useEffect, useCallback } from 'react';
import { AdminMember, AdminFormData } from '../types/admin';

// Mock data - would be replaced with API calls in production
const ALL_ADMIN_MEMBERS: AdminMember[] = [
  {
    id: "admin-1",
    username: "admin_super",
    name: "John Smith",
    email: "jsmith@example.com",
    phoneNumber: "0923 456 7890",
    role: "super_admin",
    accessLevel: "System Administrator",
    isActive: true
  },
  {
    id: "admin-2",
    username: "admin_content",
    name: "Maria Garcia",
    email: "mgarcia@example.com",
    phoneNumber: "0923 789 1234",
    role: "admin",
    accessLevel: "Content Manager",
    isActive: true
  },
  {
    id: "admin-3", 
    username: "admin_user",
    name: "Alex Johnson",
    email: "ajohnson@example.com",
    phoneNumber: "0923 321 6547",
    role: "admin",
    accessLevel: "User Manager",
    isActive: true
  }
];

export function useAdmins() {
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      // const response = await fetch('/api/admins');
      // const data = await response.json();
      
      // Using the mock data for now
      setAdmins(ALL_ADMIN_MEMBERS);
      setError(null);
    } catch (err) {
      setError('Failed to fetch admins');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const addAdmin = useCallback(async (adminData: AdminFormData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/admins', {
      //   method: 'POST',
      //   body: JSON.stringify(adminData)
      // });
      // const data = await response.json();
      
      // Simulate adding to the list with a new ID
      const newAdmin: AdminMember = {
        id: `admin-${Date.now()}`,
        username: adminData.username,
        name: adminData.name,
        email: adminData.email,
        phoneNumber: adminData.phoneNumber,
        role: adminData.role,
        accessLevel: adminData.accessLevel,
        isActive: true
      };
      
      setAdmins(prev => [...prev, newAdmin]);
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Failed to add admin' };
    }
  }, []);
  
  const updateAdmin = useCallback(async (id: string, adminData: Partial<AdminFormData>) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/admins/${id}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify(adminData)
      // });
      // const data = await response.json();
      
      setAdmins(prev => prev.map(admin => 
        admin.id === id ? { ...admin, ...adminData } : admin
      ));
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Failed to update admin' };
    }
  }, []);
  
  const toggleAdminStatus = useCallback(async (id: string) => {
    try {
      // In a real app, this would be an API call
      setAdmins(prev => prev.map(admin => 
        admin.id === id ? { ...admin, isActive: !admin.isActive } : admin
      ));
      return { success: true };
    } catch (err) {
      console.error(err);
      return { success: false, error: 'Failed to toggle admin status' };
    }
  }, []);
  
  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);
  
  return {
    admins,
    isLoading,
    error,
    fetchAdmins,
    addAdmin,
    updateAdmin,
    toggleAdminStatus
  };
}