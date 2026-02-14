/**
 * Calculates route and ETA between two points using backend OSRM proxy.
 * Uses React Query for caching: same from/to returns cached route.
 */
import { useQuery } from '@tanstack/react-query';
import { apiPost } from '../services/api';

function buildRouteKey(from, to) {
  const f = from && (typeof from === 'string' ? from : [from?.lat, from?.lng].join(','));
  const t = to && (typeof to === 'string' ? to : [to?.lat, to?.lng].join(','));
  return [f, t].filter(Boolean).join('|');
}

/**
 * @param {{ from: { lat: number, lng: number } | { address: string }, to: { lat: number, lng: number } | { address: string } } | null} params - from/to; null to skip
 * @returns {{ route: [number, number][], duration: number, distance: number, durationSeconds: number, distanceMeters: number, isLoading: boolean, error: Error | null, refetch: function }}
 */
export function useOSRM(params) {
  const from = params?.from;
  const to = params?.to;
  const enabled = !!from && !!to;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['osrm', buildRouteKey(from, to)],
    queryFn: async () => {
      const res = await apiPost('/api/routing/calculate', { from, to });
      return res;
    },
    enabled,
    staleTime: 60 * 1000, // 1 min cache
    gcTime: 5 * 60 * 1000,
  });

  return {
    route: data?.path ?? [],
    duration: data?.duration_seconds ?? 0,
    distance: data?.distance_meters ?? 0,
    durationSeconds: data?.duration_seconds ?? 0,
    distanceMeters: data?.distance_meters ?? 0,
    isLoading: enabled && isLoading,
    error: error ?? null,
    refetch,
  };
}
