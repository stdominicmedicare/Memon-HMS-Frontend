/**
 * Ambulance (driver) API hooks with TanStack Query. /api/ambulance/* endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '../services/api';

const keys = {
  dashboard: ['ambulance', 'dashboard'],
  fleetView: ['ambulance', 'fleet-view'],
};

export function useAmbulanceDashboard() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => apiGet('/api/ambulance/dashboard'),
    refetchOnWindowFocus: true,
  });
}

/** Fleet view for driver: all ambulances + positions, myAmbulanceId, stats. */
export function useAmbulanceFleetView() {
  return useQuery({
    queryKey: keys.fleetView,
    queryFn: () => apiGet('/api/ambulance/fleet-view'),
    refetchInterval: 15 * 1000,
  });
}

export function useUpdateAmbulanceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPatch('/api/ambulance/status', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.dashboard }),
  });
}

export function useAcceptTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPost(`/api/ambulance/requests/${id}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: keys.fleetView });
    },
  });
}

export function useRejectTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPost(`/api/ambulance/requests/${id}/reject`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.dashboard }),
  });
}

export function useStartTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPatch(`/api/ambulance/requests/${id}/start`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.dashboard }),
  });
}

export function useArrivedTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPatch(`/api/ambulance/requests/${id}/arrived`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.dashboard }),
  });
}

export function usePatientPickedTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPatch(`/api/ambulance/requests/${id}/patient-picked`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.dashboard }),
  });
}

export function useArrivedAtHospitalTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPatch(`/api/ambulance/requests/${id}/arrived-at-hospital`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.dashboard }),
  });
}

export function useCompleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trip_notes }) => apiPatch(`/api/ambulance/requests/${id}/complete`, { trip_notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: keys.fleetView });
    },
  });
}
