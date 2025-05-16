import { useState, useCallback } from 'react';
import { StaffMember, StaffFormData, POSITIONS } from '../../src/types/staff';

// Mock data - would be replaced with API calls in production
const INITIAL_STAFF: StaffMember[] = Array.from({ length: 3 }, (_, i) => {
  const positionIndex = i % POSITIONS.length;
  
  return {
    id: `id-${i + 1}`,
    username: `user${i + 1}`,
    name: `Name ${i + 1}`,
    email: `user${i + 1}@example.com`,
    phoneNumber: "0923 321 7654",
    role: "Staff", 
    position: POSITIONS[positionIndex],
    isActive: true
  };
});

export function useStaff() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const addStaff = useCallback(async (staffData: StaffFormData) => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      // const response = await fetch('/api/staff', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(staffData)
      // });
      // const data = await response.json();
      
      // For now, simulate adding a staff member
      const newStaff: StaffMember = {
        id: `id-${Date.now()}`,
        username: staffData.email.split('@')[0],
        name: staffData.name,
        email: staffData.email,
        phoneNumber: staffData.phoneNumber,
        role: staffData.role,
        position: staffData.position,
        isActive: true
      };
      
      setStaff(prevStaff => [...prevStaff, newStaff]);
      setError(null);
      return { success: true };
    } catch (err) {
      setError('Failed to add staff member');
      console.error(err);
      return { success: false, error: 'Failed to add staff member' };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const updateStaff = useCallback(async (staffId: string, staffData: Partial<StaffFormData>) => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      // const response = await fetch(`/api/staff/${staffId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(staffData)
      // });
      // const data = await response.json();
      
      // For now, simulate updating a staff member
      setStaff(prevStaff => prevStaff.map(member => 
        member.id === staffId 
          ? { 
              ...member, 
              name: staffData.name || member.name,
              email: staffData.email || member.email,
              phoneNumber: staffData.phoneNumber || member.phoneNumber,
              role: staffData.role || member.role,
              position: staffData.position || member.position,
            } 
          : member
      ));
      
      setError(null);
      return { success: true };
    } catch (err) {
      setError('Failed to update staff member');
      console.error(err);
      return { success: false, error: 'Failed to update staff member' };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const toggleStaffStatus = useCallback(async (staffId: string) => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      // const response = await fetch(`/api/staff/${staffId}/toggle-status`, {
      //   method: 'POST'
      // });
      // const data = await response.json();
      
      // For now, simulate toggling status
      setStaff(prevStaff => prevStaff.map(member => 
        member.id === staffId 
          ? { ...member, isActive: !member.isActive } 
          : member
      ));
      
      setError(null);
      return { success: true };
    } catch (err) {
      setError('Failed to toggle staff status');
      console.error(err);
      return { success: false, error: 'Failed to toggle staff status' };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    staff,
    isLoading,
    error,
    addStaff,
    updateStaff,
    toggleStaffStatus
  };
}