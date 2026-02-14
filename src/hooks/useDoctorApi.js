/**
 * Doctor API hooks with TanStack Query. /api/doctor/* endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '../services/api';

const keys = {
  patients: ['doctor', 'patients'],
  appointments: ['doctor', 'appointments'],
  records: (patientId) => ['doctor', 'records', patientId],
  prescriptions: (patientId) => ['doctor', 'prescriptions', patientId],
};

export function useDoctorPatients() {
  return useQuery({
    queryKey: keys.patients,
    queryFn: () => apiGet('/api/doctor/patients'),
  });
}

export function useDoctorAppointments() {
  return useQuery({
    queryKey: keys.appointments,
    queryFn: () => apiGet('/api/doctor/appointments'),
  });
}

export function useDoctorRecords(patientId = null) {
  return useQuery({
    queryKey: keys.records(patientId),
    queryFn: () => apiGet(patientId ? `/api/doctor/records?patient_id=${patientId}` : '/api/doctor/records'),
  });
}

export function useDoctorPrescriptions(patientId = null) {
  return useQuery({
    queryKey: keys.prescriptions(patientId),
    queryFn: () => apiGet(patientId ? `/api/doctor/prescriptions?patient_id=${patientId}` : '/api/doctor/prescriptions'),
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }) => apiPatch(`/api/doctor/appointments/${id}`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.appointments });
      queryClient.invalidateQueries({ queryKey: keys.patients });
    },
  });
}

export function useEmergencyRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/doctor/emergency-request', body),
  });
}

export function useRequestIcuAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/doctor/icu-admission-request', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctor', 'icu-requests'] }),
  });
}

export function useDoctorIcuRequests() {
  return useQuery({
    queryKey: ['doctor', 'icu-requests'],
    queryFn: () => apiGet('/api/doctor/icu-requests'),
  });
}

export function useDoctorTransferTrips() {
  return useQuery({
    queryKey: ['doctor', 'transfer-trips'],
    queryFn: () => apiGet('/api/doctor/transfer-trips'),
    refetchInterval: 30 * 1000,
  });
}

export function useDoctorIcuMonitoring(patientId) {
  return useQuery({
    queryKey: ['doctor', 'icu-monitoring', patientId],
    queryFn: () => apiGet(`/api/doctor/icu-monitoring?patient_id=${patientId}`),
    enabled: !!patientId,
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/doctor/records', body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.records(variables.patient_id) });
      queryClient.invalidateQueries({ queryKey: keys.records(null) });
      queryClient.invalidateQueries({ queryKey: keys.patients });
    },
  });
}

export function useCreatePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/doctor/prescriptions', body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.prescriptions(variables.patient_id) });
      queryClient.invalidateQueries({ queryKey: keys.prescriptions(null) });
    },
  });
}

export function useCreateBloodRequest() {
  return useMutation({
    mutationFn: (body) => apiPost('/api/doctor/blood-requests', body),
  });
}
