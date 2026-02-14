/**
 * Volunteer API hooks. /api/volunteer/* endpoints.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '../services/api';

const keys = {
  profile: ['volunteer', 'profile'],
  donationRequests: ['volunteer', 'donation-requests'],
  donations: ['volunteer', 'donations'],
};

export function useVolunteerProfile() {
  return useQuery({
    queryKey: keys.profile,
    queryFn: () => apiGet('/api/volunteer/profile'),
  });
}

export function useVolunteerDonationRequests() {
  return useQuery({
    queryKey: keys.donationRequests,
    queryFn: () => apiGet('/api/volunteer/donation-requests'),
    refetchInterval: 60 * 1000,
  });
}

export function useVolunteerUpdateAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (is_available) => apiPatch('/api/volunteer/availability', { is_available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.profile });
    },
  });
}

export function useVolunteerAcceptRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId) => apiPost(`/api/volunteer/donation-requests/${requestId}/accept`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.donationRequests });
      queryClient.invalidateQueries({ queryKey: keys.donations });
    },
  });
}

export function useVolunteerDonations() {
  return useQuery({
    queryKey: keys.donations,
    queryFn: () => apiGet('/api/volunteer/donations'),
  });
}
