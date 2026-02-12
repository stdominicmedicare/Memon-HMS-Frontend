/**
 * Admin API hooks – dashboard stats, users, doctors (shared).
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../services/api';

const keys = {
  dashboard: ['admin', 'dashboard'],
};

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: keys.dashboard,
    queryFn: () => apiGet('/api/admin/dashboard'),
  });
}
