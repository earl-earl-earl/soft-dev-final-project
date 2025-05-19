/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToReservationChanges } from '@/utils/fetchReservations';
import { subscribeToRoomsChanges } from '@/utils/fetchRooms';
import { subscribeToStaffChanges } from '@/utils/fetchStaff';
import { subscribeToAdminChanges } from '@/utils/fetchAdmins';

interface CacheContextType {
  reservationsData: any | null;
  roomsData: any | null;
  staffData: any | null;
  adminsData: any | null;
  lastFetched: {
    reservations: Date | null;
    rooms: Date | null;
    staff: Date | null;
    admins: Date | null;
  };
  clearCache: () => void;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [reservationsData, setReservationsData] = useState<any | null>(null);
  const [roomsData, setRoomsData] = useState<any | null>(null);
  const [staffData, setStaffData] = useState<any | null>(null);
  const [adminsData, setAdminsData] = useState<any | null>(null);
  
  const [lastFetched, setLastFetched] = useState<{
    reservations: Date | null;
    rooms: Date | null;
    staff: Date | null;
    admins: Date | null;
  }>({
    reservations: null,
    rooms: null,
    staff: null,
    admins: null
  });

  useEffect(() => {
    // Set up subscriptions to keep cache fresh
    const reservationsSubscription = subscribeToReservationChanges((data) => {
      setReservationsData(data);
      setLastFetched(prev => ({...prev, reservations: new Date()}));
    });
    
    const roomsSubscription = subscribeToRoomsChanges((data) => {
      setRoomsData(data);
      setLastFetched(prev => ({...prev, rooms: new Date()}));
    });
    
    const staffSubscription = subscribeToStaffChanges((data) => {
      setStaffData(data);
      setLastFetched(prev => ({...prev, staff: new Date()}));
    });
    
    const adminsSubscription = subscribeToAdminChanges((data) => {
      setAdminsData(data);
      setLastFetched(prev => ({...prev, admins: new Date()}));
    });
    
    // Clean up subscriptions
    return () => {
      reservationsSubscription.unsubscribe();
      roomsSubscription.unsubscribe();
      staffSubscription.unsubscribe();
      adminsSubscription.unsubscribe();
    };
  }, []);
  
  const clearCache = () => {
    setReservationsData(null);
    setRoomsData(null);
    setStaffData(null);
    setAdminsData(null);
    setLastFetched({
      reservations: null,
      rooms: null,
      staff: null,
      admins: null
    });
  };
  
  return (
    <CacheContext.Provider value={{
      reservationsData,
      roomsData,
      staffData,
      adminsData,
      lastFetched,
      clearCache
    }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};