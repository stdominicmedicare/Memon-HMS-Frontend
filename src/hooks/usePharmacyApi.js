/**
 * Pharmacy API hooks – dashboard, medicines, prescriptions, dispensing, procurement, expiry.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '../services/api';

const keys = {
  dashboard: ['pharmacy', 'dashboard'],
  medicines: (search, category) => ['pharmacy', 'medicines', search, category],
  pendingPrescriptions: ['pharmacy', 'pending-prescriptions'],
  dispensingLogs: ['pharmacy', 'dispensing-logs'],
  expiry: ['pharmacy', 'expiry'],
  purchaseOrders: ['pharmacy', 'purchase-orders'],
};

export function usePharmacyDashboard() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => apiGet('/api/pharmacy/dashboard'),
    refetchOnWindowFocus: true,
  });
}

export function usePharmacyMedicines(search = '', category = '') {
  return useQuery({
    queryKey: keys.medicines(search, category),
    queryFn: () => apiGet(`/api/pharmacy/medicines?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`),
  });
}

export function usePharmacyCreateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/pharmacy/medicines', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
      queryClient.invalidateQueries({ queryKey: keys.expiry });
    },
  });
}

export function usePharmacyUpdateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiPatch(`/api/pharmacy/medicines/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
      queryClient.invalidateQueries({ queryKey: keys.expiry });
    },
  });
}

export function usePharmacyDeleteMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiDelete(`/api/pharmacy/medicines/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
    },
  });
}

export function usePharmacyPendingPrescriptions() {
  return useQuery({
    queryKey: keys.pendingPrescriptions,
    queryFn: () => apiGet('/api/pharmacy/prescriptions/pending'),
    refetchOnWindowFocus: true,
  });
}

export function usePharmacyDispensePrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPost(`/api/pharmacy/prescriptions/${id}/dispense`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: keys.pendingPrescriptions });
      queryClient.invalidateQueries({ queryKey: keys.dispensingLogs });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
    },
  });
}

export function usePharmacyRejectPrescription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPost(`/api/pharmacy/prescriptions/${id}/reject`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: keys.pendingPrescriptions });
    },
  });
}

export function usePharmacyDispensingLogs() {
  return useQuery({
    queryKey: keys.dispensingLogs,
    queryFn: () => apiGet('/api/pharmacy/dispensing-logs'),
  });
}

export function usePharmacyExpiryList() {
  return useQuery({
    queryKey: keys.expiry,
    queryFn: () => apiGet('/api/pharmacy/expiry'),
  });
}

export function usePharmacyPurchaseOrders() {
  return useQuery({
    queryKey: keys.purchaseOrders,
    queryFn: () => apiGet('/api/pharmacy/purchase-orders'),
  });
}

export function usePharmacyCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost('/api/pharmacy/purchase-orders', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.purchaseOrders });
    },
  });
}

export function usePharmacyUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => apiPatch(`/api/pharmacy/purchase-orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.purchaseOrders });
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: ['pharmacy', 'medicines'] });
    },
  });
}
