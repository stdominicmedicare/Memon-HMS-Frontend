/**
 * Admin ambulance API hooks. /api/admin/ambulances, ambulance-requests, etc.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../services/api';

const keys = {
  ambulances: ['admin', 'ambulances'],
  ambulanceRequests: ['admin', 'ambulance-requests'],
  ambulanceDrivers: ['admin', 'ambulance-drivers'],
  fleetStatus: ['admin', 'fleet-status'],
};

export function useAdminAmbulances() {
  return useQuery({
    queryKey: keys.ambulances,
    queryFn: () => apiGet('/api/admin/ambulances'),
  });
}

export function useAdminAmbulanceRequests() {
  return useQuery({
    queryKey: keys.ambulanceRequests,
    queryFn: () => apiGet('/api/admin/ambulance-requests'),
  });
}

export function useAdminAmbulanceDrivers() {
  return useQuery({
    queryKey: keys.ambulanceDrivers,
    queryFn: () => apiGet('/api/admin/ambulance-drivers'),
  });
}

export function useCreateAmbulance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/admin/ambulances', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.ambulances }),
  });
}

export function useUpdateAmbulance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => apiPatch(`/api/admin/ambulances/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.ambulances });
      queryClient.invalidateQueries({ queryKey: keys.fleetStatus });
    },
  });
}

export function useDeleteAmbulance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiDelete(`/api/admin/ambulances/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.ambulances });
      queryClient.invalidateQueries({ queryKey: keys.ambulanceRequests });
    },
  });
}

export function useAssignAmbulanceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ambulance_id, assigned_driver_id }) =>
      apiPatch(`/api/admin/ambulance-requests/${id}/assign`, { ambulance_id, assigned_driver_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.ambulanceRequests });
      queryClient.invalidateQueries({ queryKey: keys.fleetStatus });
    },
  });
}

export function useFleetStatus() {
  return useQuery({
    queryKey: keys.fleetStatus,
    queryFn: () => apiGet('/api/admin/fleet-status'),
    refetchInterval: 30 * 1000,
  });
}
