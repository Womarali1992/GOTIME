import { useState, useEffect, useCallback } from 'react';
import { dataService } from '@/lib/services/data-service';
import { TimeSlot, Reservation, Clinic } from '@/lib/types';

export const useReservations = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh data
  const refreshData = useCallback(() => {
    dataService.ensureDataConsistency();
    setRefreshKey(prev => prev + 1);
  }, []);

  // Function to get time slots with status for a specific date
  const getTimeSlotsForDate = useCallback((date: string, courtId?: string) => {
    return dataService.timeSlotService.getTimeSlotsForDate(date, courtId);
  }, []);

  // Function to get reservations for a specific date
  const getReservationsForDateHook = useCallback((date: string) => {
    return dataService.reservationService.getAllReservations().filter(reservation => {
      const slot = dataService.timeSlotService.getTimeSlotById(reservation.timeSlotId);
      return slot && slot.date === date;
    });
  }, []);

  // Function to get all reservations
  const getAllReservations = useCallback(() => {
    return dataService.reservationService.getAllReservations();
  }, []);

  // Function to get all time slots
  const getAllTimeSlots = useCallback(() => {
    return dataService.timeSlotService.getAllTimeSlots();
  }, []);

  // Function to get all clinics
  const getAllClinics = useCallback(() => {
    return dataService.clinicService.getAllClinics();
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
    reservations: getAllReservations(),
    timeSlots: getAllTimeSlots(),
    clinics: getAllClinics(),
    refreshData,
    getTimeSlotsForDate,
    getReservationsForDate: getReservationsForDateHook,
    getAllReservations,
    getAllTimeSlots,
    getAllClinics,
    refreshKey
  };
};
