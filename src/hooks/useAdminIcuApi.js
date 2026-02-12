/**
 * Admin ICU API hooks – beds CRUD, analytics.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../services/api';

const keys = {
  icuBeds: ['admin', 'icu-beds'],
  icuAnalytics: ['admin', 'icu-analytics'],
};

export function useAdminIcuBeds() {
  return useQuery({
    queryKey: keys.icuBeds,
    queryFn: () => apiGet('/api/admin/icu-beds'),
  });
}

export function useAdminCreateIcuBed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/admin/icu-beds', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.icuBeds }),
  });
}

export function useAdminUpdateIcuBed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiPatch(`/api/admin/icu-beds/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.icuBeds }),
  });
}

export function useAdminDeleteIcuBed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiDelete(`/api/admin/icu-beds/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.icuBeds }),
  });
}

export function useAdminIcuAnalytics() {
  return useQuery({
    queryKey: keys.icuAnalytics,
    queryFn: () => apiGet('/api/admin/icu-analytics'),
  });
}
