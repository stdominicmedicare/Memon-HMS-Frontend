/**
 * Patient API hooks with TanStack Query. /api/patient/* endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '../services/api';

const keys = {
  stats: ['patient', 'dashboard', 'stats'],
  appointments: ['patient', 'appointments'],
  records: ['patient', 'records'],
  prescriptions: ['patient', 'prescriptions'],
  doctors: ['patient', 'doctors'],
  ambulanceRequests: ['patient', 'ambulance-requests'],
};

export function usePatientStats() {
  return useQuery({
    queryKey: keys.stats,
    queryFn: () => apiGet('/api/patient/dashboard/stats'),
  });
}

export function usePatientAppointments() {
  return useQuery({
    queryKey: keys.appointments,
    queryFn: () => apiGet('/api/patient/appointments'),
  });
}

export function usePatientRecords() {
  return useQuery({
    queryKey: keys.records,
    queryFn: () => apiGet('/api/patient/records'),
  });
}

export function usePatientPrescriptions() {
  return useQuery({
    queryKey: keys.prescriptions,
    queryFn: () => apiGet('/api/patient/prescriptions'),
  });
}

export function usePatientDoctors() {
  return useQuery({
    queryKey: keys.doctors,
    queryFn: () => apiGet('/api/patient/doctors'),
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/patient/appointments', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.appointments });
      queryClient.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function usePatientAmbulanceRequests() {
  return useQuery({
    queryKey: keys.ambulanceRequests,
    queryFn: () => apiGet('/api/patient/ambulance-requests'),
  });
}

export function usePatientActiveTrip() {
  return useQuery({
    queryKey: ['patient', 'ambulance-requests', 'active'],
    queryFn: () => apiGet('/api/patient/ambulance-requests/active'),
    refetchInterval: (data) => (data ? 30 * 1000 : false),
  });
}

/** Ambulance availability for patient map (nearby ambulances: status + position). */
export function usePatientAmbulanceAvailability() {
  return useQuery({
    queryKey: ['patient', 'ambulance-availability'],
    queryFn: () => apiGet('/api/patient/ambulance-availability'),
    refetchInterval: 60 * 1000,
  });
}

export function useCreateAmbulanceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/patient/ambulance-requests', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.ambulanceRequests });
      queryClient.invalidateQueries({ queryKey: ['patient', 'ambulance-requests', 'active'] });
    },
  });
}

export function usePatientIcuStatus() {
  return useQuery({
    queryKey: ['patient', 'icu-status'],
    queryFn: () => apiGet('/api/patient/icu-status'),
  });
}

export function usePatientIcuMonitoringReport() {
  return useQuery({
    queryKey: ['patient', 'icu-monitoring-report'],
    queryFn: () => apiGet('/api/patient/icu-monitoring-report'),
  });
}

export function useCancelAmbulanceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPatch(`/api/patient/ambulance-requests/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.ambulanceRequests });
      queryClient.invalidateQueries({ queryKey: ['patient', 'ambulance-requests', 'active'] });
    },
  });
}

export function usePatientTransfusionHistory() {
  return useQuery({
    queryKey: ['patient', 'transfusion-history'],
    queryFn: () => apiGet('/api/patient/transfusion-history'),
  });
}
