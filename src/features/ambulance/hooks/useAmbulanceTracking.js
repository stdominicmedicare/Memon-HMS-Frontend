/**
 * Driver GPS broadcasting: start/stop, broadcast every 5s, persist location history, broadcast status.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../../../services/api';
import { startBroadcasting } from '../../../services/realtimeService';
import { useGeolocation } from '../../../hooks/useGeolocation';

const BROADCAST_INTERVAL_MS = 5000;
const DASHBOARD_QUERY_KEY = ['ambulance', 'dashboard'];

/**
 * Returns controls to start/stop GPS broadcasting and broadcast status.
 * Start: calls tracking/start, then broadcasts location every 5s and POST /api/tracking/location for history.
 */
export function useAmbulanceTracking() {
  const queryClient = useQueryClient();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const broadcastFnRef = useRef(null);
  const broadcastStatusFnRef = useRef(null);
  const latestPosRef = useRef({ lat: null, lng: null, speed: null });
  const currentTripIdRef = useRef(null);

  const { latitude, longitude, speed, heading, error: geoError } = useGeolocation(isBroadcasting);

  useEffect(() => {
    if (latitude != null && longitude != null) {
      latestPosRef.current = { lat: latitude, lng: longitude, speed: speed ?? null };
    }
  }, [latitude, longitude, speed]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    broadcastFnRef.current = null;
    broadcastStatusFnRef.current = null;
    currentTripIdRef.current = null;
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setIsBroadcasting(false);
    setError(null);
    queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
  }, [queryClient]);

  const start = useCallback(
    async (tripId) => {
      if (!tripId) {
        setError('Trip ID required');
        return;
      }
      setError(null);
      setIsStarting(true);

      try {
        await apiPost('/api/tracking/start', { trip_id: tripId });
        queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });

        const { broadcast, broadcastStatus, unsubscribe } = await startBroadcasting(tripId);
        unsubscribeRef.current = unsubscribe;
        broadcastFnRef.current = broadcast;
        broadcastStatusFnRef.current = broadcastStatus;
        currentTripIdRef.current = tripId;
        setIsBroadcasting(true);

        const sendUpdate = () => {
          const pos = latestPosRef.current;
          const tripIdCurrent = currentTripIdRef.current;
          if (pos.lat != null && pos.lng != null) {
            broadcastFnRef.current?.({ lat: pos.lat, lng: pos.lng, speed: pos.speed ?? undefined });
            if (tripIdCurrent) {
              apiPost('/api/tracking/location', {
                trip_id: tripIdCurrent,
                lat: pos.lat,
                lng: pos.lng,
                speed: pos.speed ?? undefined,
              }).catch(() => {});
            }
          }
        };

        sendUpdate();
        intervalRef.current = setInterval(sendUpdate, BROADCAST_INTERVAL_MS);
      } catch (err) {
        setError(err.message || 'Failed to start tracking');
      } finally {
        setIsStarting(false);
      }
    },
    [queryClient]
  );

  const broadcastStatus = useCallback((status) => {
    broadcastStatusFnRef.current?.({ status });
  }, []);

  return {
    start,
    stop,
    isBroadcasting,
    isStarting,
    error: error || geoError || null,
    position: latitude != null && longitude != null ? { latitude, longitude, speed, heading } : null,
    broadcastStatus,
  };
}
