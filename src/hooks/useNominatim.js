/**
 * Geocodes an address via backend Nominatim proxy.
 * Uses React Query for caching: same address returns cached lat/lng.
 */
import { useQuery } from '@tanstack/react-query';
import { apiPost } from '../services/api';

/**
 * @param {string | null} address - Address to geocode; null/empty to skip
 * @returns {{ lat: number | null, lng: number | null, address: string | null, loading: boolean, error: Error | null, refetch: function }}
 */
export function useNominatim(address) {
  const normalized = typeof address === 'string' ? address.trim() : '';
  const enabled = normalized.length > 0;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['geocode', normalized],
    queryFn: async () => {
      const res = await apiPost('/api/geocode', { address: normalized });
      return res;
    },
    enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24h cache (backend also caches)
    gcTime: 24 * 60 * 60 * 1000,
  });

  return {
    lat: data?.lat ?? null,
    lng: data?.lng ?? null,
    address: data?.address ?? null,
    loading: enabled && isLoading,
    error: error ?? null,
    refetch,
  };
}
