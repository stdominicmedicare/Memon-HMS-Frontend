/**
 * ICU API hooks – dashboard, beds, admission requests, monitoring, history.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '../services/api';

const keys = {
  dashboard: ['icu', 'dashboard'],
  admissionRequests: (status) => ['icu', 'admission-requests', status],
  activePatients: ['icu', 'active-patients'],
  incomingPatients: ['icu', 'incoming-patients'],
  monitoring: (patientId) => ['icu', 'monitoring', patientId],
  history: ['icu', 'history'],
};

export function useIcuDashboard() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => apiGet('/api/icu/dashboard'),
    refetchOnWindowFocus: true,
  });
}

export function useUpdateBedStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bedId, status }) => apiPatch(`/api/icu/beds/${bedId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: keys.incomingPatients });
    },
  });
}

export function useIcuAdmissionRequests(status = 'pending') {
  return useQuery({
    queryKey: keys.admissionRequests(status),
    queryFn: () => apiGet(`/api/icu/admission-requests?status=${status}`),
  });
}

export function useApproveIcuRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigned_bed_id }) =>
      apiPost(`/api/icu/admission-requests/${id}/approve`, assigned_bed_id != null ? { assigned_bed_id } : {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: ['icu', 'admission-requests'] });
    },
  });
}

export function useRejectIcuRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPost(`/api/icu/admission-requests/${id}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: ['icu', 'admission-requests'] });
    },
  });
}

export function useAssignBedToRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigned_bed_id }) =>
      apiPatch(`/api/icu/admission-requests/${id}/assign-bed`, { assigned_bed_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: ['icu', 'admission-requests'] });
    },
  });
}

export function useIcuActivePatients() {
  return useQuery({
    queryKey: keys.activePatients,
    queryFn: () => apiGet('/api/icu/active-patients'),
  });
}

export function useIcuIncomingPatients() {
  return useQuery({
    queryKey: keys.incomingPatients,
    queryFn: () => apiGet('/api/icu/incoming-patients'),
    refetchInterval: 30 * 1000,
  });
}

export function useIcuMonitoringLogs(patientId) {
  return useQuery({
    queryKey: keys.monitoring(patientId),
    queryFn: () => apiGet(`/api/icu/monitoring?patientId=${patientId}`),
    enabled: !!patientId,
  });
}

export function useAddIcuMonitoringLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/icu/monitoring', body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: keys.monitoring(variables.patient_id) });
      queryClient.invalidateQueries({ queryKey: keys.activePatients });
    },
  });
}

export function useDischargeIcuPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ admissionRecordId, discharge_reason, final_status }) =>
      apiPatch(`/api/icu/admission-records/${admissionRecordId}/discharge`, {
        discharge_reason,
        final_status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: keys.activePatients });
      queryClient.invalidateQueries({ queryKey: keys.history });
    },
  });
}

export function useTransferBed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ admissionRecordId, new_bed_id }) =>
      apiPatch(`/api/icu/admission-records/${admissionRecordId}/transfer-bed`, { new_bed_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: keys.activePatients });
    },
  });
}

export function useRequestAmbulanceTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/icu/request-ambulance-transfer', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.dashboard }),
  });
}

export function useIcuHistory() {
  return useQuery({
    queryKey: keys.history,
    queryFn: () => apiGet('/api/icu/history'),
  });
}

export function useCreateBloodRequest() {
  return useMutation({
    mutationFn: (body) => apiPost('/api/icu/blood-requests', body),
  });
}
