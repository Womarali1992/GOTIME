import { useState, useEffect, useCallback } from 'react';
import { 
  reservations, 
  timeSlots, 
  clinics, 
  getTimeSlotsWithStatusForDate, 
  getReservationsForDate,
  refreshReservationData,
  ensureReservationConsistency
} from '@/lib/data';
import { TimeSlot, Reservation, Clinic } from '@/lib/types';

export const useReservations = () => {
  const [reservationData, setReservationData] = useState({
    reservations: [...reservations],
    timeSlots: [...timeSlots],
    clinics: [...clinics]
  });

  // Function to refresh data
  const refreshData = useCallback(() => {
    ensureReservationConsistency();
    setReservationData({
      reservations: [...reservations],
      timeSlots: [...timeSlots],
      clinics: [...clinics]
    });
  }, []);

  // Function to get time slots with status for a specific date
  const getTimeSlotsForDate = useCallback((date: string, courtId?: string) => {
    return getTimeSlotsWithStatusForDate(date, courtId);
  }, []);

  // Function to get reservations for a specific date
  const getReservationsForDate = useCallback((date: string) => {
    return getReservationsForDate(date);
  }, []);

  // Function to get all reservations
  const getAllReservations = useCallback(() => {
    return [...reservations];
  }, []);

  // Function to get all time slots
  const getAllTimeSlots = useCallback(() => {
    return [...timeSlots];
  }, []);

  // Function to get all clinics
  const getAllClinics = useCallback(() => {
    return [...clinics];
  }, []);

  // Refresh data when component mounts
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set up interval to refresh data every 30 seconds to ensure consistency
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    ...reservationData,
    refreshData,
    getTimeSlotsForDate,
    getReservationsForDate,
    getAllReservations,
    getAllTimeSlots,
    getAllClinics
  };
};
