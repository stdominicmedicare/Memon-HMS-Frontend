/**
 * Blood Bank API hooks – dashboard, donors, inventory, testing, requests, transfusion, disposal.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '../services/api';

const base = '/api/bloodbank';
const keys = {
  dashboard: ['bloodbank', 'dashboard'],
  donors: (search) => ['bloodbank', 'donors', search],
  inventory: ['bloodbank', 'inventory'],
  units: (bg, status) => ['bloodbank', 'units', bg, status],
  testing: ['bloodbank', 'testing'],
  requests: (status) => ['bloodbank', 'requests', status],
  transfusionLogs: ['bloodbank', 'transfusion-logs'],
  disposalLogs: ['bloodbank', 'disposal-logs'],
  availability: ['bloodbank', 'availability'],
};

export function useBloodBankDashboard() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => apiGet(`${base}/dashboard`),
    refetchOnWindowFocus: true,
  });
}

export function useBloodBankDonors(search = '') {
  return useQuery({
    queryKey: keys.donors(search),
    queryFn: () => apiGet(`${base}/donors?search=${encodeURIComponent(search)}`),
  });
}

export function useBloodBankCreateDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost(`${base}/donors`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bloodbank', 'donors'] });
    },
  });
}

export function useBloodBankUpdateDonor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiPatch(`${base}/donors/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bloodbank', 'donors'] });
    },
  });
}

export function useBloodBankInventory() {
  return useQuery({
    queryKey: keys.inventory,
    queryFn: () => apiGet(`${base}/inventory`),
    refetchOnWindowFocus: true,
  });
}

export function useBloodBankUnits(blood_group = '', status = '') {
  return useQuery({
    queryKey: keys.units(blood_group, status),
    queryFn: () => {
      const params = new URLSearchParams();
      if (blood_group) params.set('blood_group', blood_group);
      if (status) params.set('status', status);
      return apiGet(`${base}/units?${params}`);
    },
  });
}

export function useBloodBankCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost(`${base}/units`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: keys.inventory });
      qc.invalidateQueries({ queryKey: ['bloodbank', 'units'] });
      qc.invalidateQueries({ queryKey: keys.testing });
    },
  });
}

export function useBloodBankUpdateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => apiPatch(`${base}/units/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: keys.inventory });
      qc.invalidateQueries({ queryKey: ['bloodbank', 'units'] });
    },
  });
}

export function useBloodBankUnitsUnderTesting() {
  return useQuery({
    queryKey: keys.testing,
    queryFn: () => apiGet(`${base}/testing`),
    refetchOnWindowFocus: true,
  });
}

export function useBloodBankApproveUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPost(`${base}/units/${id}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: keys.inventory });
      qc.invalidateQueries({ queryKey: keys.testing });
      qc.invalidateQueries({ queryKey: ['bloodbank', 'units'] });
    },
  });
}

export function useBloodBankRejectUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPost(`${base}/units/${id}/reject`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: keys.testing });
      qc.invalidateQueries({ queryKey: ['bloodbank', 'units'] });
    },
  });
}

export function useBloodBankRequests(status = '') {
  return useQuery({
    queryKey: keys.requests(status),
    queryFn: () => apiGet(`${base}/requests${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    refetchOnWindowFocus: true,
  });
}

export function useBloodBankApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPost(`${base}/requests/${id}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: ['bloodbank', 'requests'] });
    },
  });
}

export function useBloodBankRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejection_reason }) => apiPost(`${base}/requests/${id}/reject`, { rejection_reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: ['bloodbank', 'requests'] });
    },
  });
}

export function useBloodBankAllocateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiPost(`${base}/requests/${id}/allocate`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: ['bloodbank', 'requests'] });
      qc.invalidateQueries({ queryKey: keys.inventory });
      qc.invalidateQueries({ queryKey: ['bloodbank', 'units'] });
    },
  });
}

export function useBloodBankRecordTransfusion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => apiPost(`${base}/transfusion`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.transfusionLogs });
      qc.invalidateQueries({ queryKey: ['bloodbank', 'units'] });
    },
  });
}

export function useBloodBankTransfusionLogs() {
  return useQuery({
    queryKey: keys.transfusionLogs,
    queryFn: () => apiGet(`${base}/transfusion-logs`),
  });
}

export function useBloodBankDisposeUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, disposal_reason }) => apiPost(`${base}/units/${id}/dispose`, { disposal_reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.dashboard });
      qc.invalidateQueries({ queryKey: keys.inventory });
      qc.invalidateQueries({ queryKey: keys.disposalLogs });
      qc.invalidateQueries({ queryKey: ['bloodbank', 'units'] });
    },
  });
}

export function useBloodBankDisposalLogs() {
  return useQuery({
    queryKey: keys.disposalLogs,
    queryFn: () => apiGet(`${base}/disposal-logs`),
  });
}

/** Blood availability (for Doctor/ICU). */
export function useBloodBankAvailability() {
  return useQuery({
    queryKey: keys.availability,
    queryFn: () => apiGet(`${base}/availability`),
  });
}
