import React, { useState, useEffect } from "react";
import styles from "../../../components/component_styles/Reservations.module.css";
import StatCard from "../../common/StatCard";
import { supabase } from '@/lib/supabaseClient';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface ReservationStatsProps {
  animate: boolean;
  // Optional stats override (useful if parent already has the data)
  statistics?: {
    checkIns: number;
    checkOuts: number;
    totalGuests: number;
    occupancyRate: number;
  };
}

const ReservationStats: React.FC<ReservationStatsProps> = ({
  animate,
  statistics: externalStatistics
}) => {
  const [statistics, setStatistics] = useState({
    checkIns: 0,
    checkOuts: 0,
    totalGuests: 0,
    occupancyRate: 0
  });
  const [dateRange, setDateRange] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Generate date range text (current month)
  const getDateRangeText = () => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    return `${format(currentMonth, 'MMM dd')} - ${format(endOfMonth(now), 'MMM dd, yyyy')}`;
  };

  useEffect(() => {
    // If external statistics are provided, use those
    if (externalStatistics) {
      setStatistics(externalStatistics);
      setIsLoading(false);
      setDateRange(getDateRangeText());
      return;
    }

    const fetchReservationStats = async () => {
      try {
        setIsLoading(true);

        // Get current date
        const today = new Date();
        const currentMonthStart = startOfMonth(today);
        const currentMonthEnd = endOfMonth(today);
        
        // Format dates for Supabase query
        const formattedStart = currentMonthStart.toISOString();
        const formattedEnd = currentMonthEnd.toISOString();

        // Fetch all reservations for the current month
        // Need to modify the query to include ALL reservations ACTIVE during the month
        const { data: reservationsData, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .or(`check_in.lte.${formattedEnd},check_out.gte.${formattedStart}`);
          
        if (reservationsError) throw new Error(`Error fetching reservations: ${reservationsError.message}`);
        
        // Calculate check-ins ONLY for this month (already correct)
        const checkIns = reservationsData.filter(res => 
          new Date(res.check_in) >= currentMonthStart && 
          new Date(res.check_in) <= currentMonthEnd
        ).length;
        
        // Calculate check-outs ONLY for this month (already correct)
        const checkOuts = reservationsData.filter(res => 
          new Date(res.check_out) >= currentMonthStart && 
          new Date(res.check_out) <= currentMonthEnd
        ).length;
        
        // Calculate total guests for ALL reservations active during the month
        const totalGuests = reservationsData.reduce((sum, res) => 
          sum + (res.num_adults || 0) + (res.num_children || 0) + (res.num_seniors || 0), 0
        );
        
        // Get total rooms for occupancy calculation
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('id, status');
          
        if (roomsError) throw new Error(`Error fetching rooms: ${roomsError.message}`);
        
        // Calculate occupancy rate
        const totalRooms = roomsData.length;
        const occupiedRooms = roomsData.filter(room => room.status === "Occupied").length;
        const occupancyRate = totalRooms > 0 
          ? Math.round((occupiedRooms / totalRooms) * 100) 
          : 0;
        
        // Update state with calculated statistics
        setStatistics({
          checkIns,
          checkOuts,
          totalGuests,
          occupancyRate
        });
        
        // Set date range
        setDateRange(getDateRangeText());

      } catch (err) {
        console.error('Error calculating reservation statistics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservationStats();

    // Set up real-time subscription for reservations and rooms
    const reservation_subscription = supabase
      .channel('reservation-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'reservations' 
        }, 
        () => {
          console.log("Reservation change detected, refreshing statistics...");
          fetchReservationStats();
        }
      )
      .subscribe();
      
    const room_subscription = supabase
      .channel('room-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'rooms' 
        }, 
        () => {
          console.log("Room change detected, refreshing statistics...");
          fetchReservationStats();
        }
      )
      .subscribe();
      
    return () => {
      reservation_subscription.unsubscribe();
      room_subscription.unsubscribe();
    };
  }, [externalStatistics]);
  
  // Show loading skeleton if data is loading
  if (isLoading) {
    return (
      <div className={styles.statsCardsContainer}>
        <div className={styles.statCardSkeleton}></div>
        <div className={styles.statCardSkeleton}></div>
        <div className={styles.statCardSkeleton}></div>
        <div className={styles.statCardSkeleton}></div>
      </div>
    );
  }

  return (
    <div className={styles.statsCardsContainer}>
      <StatCard
        title="Total Check-ins"
        value={statistics.checkIns.toString()}
        valueIconClass="fa-regular fa-person-to-portal"
        dateRange={dateRange}
        dateRangeColor="#007bff"
        dateRangeBg="#e7f3ff"
        animate={animate}
      />
      <StatCard
        title="Total Check-outs"
        value={statistics.checkOuts.toString()}
        valueIconClass="fa-regular fa-person-from-portal"
        dateRange={dateRange}
        dateRangeColor="#6c757d"
        dateRangeBg="#f8f9fa"
        animate={animate}
      />
      <StatCard
        title="Total Guests"
        value={statistics.totalGuests.toString()}
        valueIconClass="fa-regular fa-people-simple"
        dateRange={dateRange}
        dateRangeColor="#6c757d"
        dateRangeBg="#f8f9fa"
        animate={animate}
      />
      <StatCard
        title="Occupancy Rate"
        value={`${statistics.occupancyRate}%`}
        valueIconClass="fa-regular fa-chart-line"
        dateRange={dateRange}
        dateRangeColor="#6c757d"
        dateRangeBg="#f8f9fa"
        animate={animate}
      />
    </div>
  );
};

export default ReservationStats;