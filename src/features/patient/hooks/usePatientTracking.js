/**
 * Patient tracking: subscribe to trip Realtime channel for location + status.
 * Supabase client handles reconnection; we show connection state from received updates.
 */
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToTrip } from '../../../services/realtimeService';
import { usePatientActiveTrip } from '../../../hooks/usePatientApi';

const LOCATION_STALE_MS = 90 * 1000;

/**
 * Subscribes to active trip's channel. Returns ambulance location, trip status (API + Realtime), connection status.
 * locationStale: true when subscribed but no location update for LOCATION_STALE_MS (e.g. driver GPS lost).
 */
export function usePatientTracking() {
  const queryClient = useQueryClient();
  const { data: trip, isLoading: tripLoading, refetch: refetchTrip } = usePatientActiveTrip();
  const [location, setLocation] = useState(null);
  const [tripStatus, setTripStatus] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [locationStale, setLocationStale] = useState(false);
  const lastLocationTimeRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const tripId = trip?.id ?? null;
  const statusFromApi = trip?.status ?? null;

  useEffect(() => {
    if (!tripId) {
      setLocation(null);
      setTripStatus(statusFromApi);
      setConnectionStatus('disconnected');
      setLocationStale(false);
      lastLocationTimeRef.current = null;
      return;
    }

    setTripStatus(statusFromApi);
    setConnectionStatus('connecting');
    setLocationStale(false);
    lastLocationTimeRef.current = null;

    unsubscribeRef.current = subscribeToTrip(tripId, {
      onLocation: (data) => {
        setLocation({ lat: data.lat, lng: data.lng, speed: data.speed, timestamp: data.timestamp });
        setConnectionStatus('connected');
        lastLocationTimeRef.current = Date.now();
        setLocationStale(false);
      },
      onStatus: (data) => {
        if (data?.status) {
          setTripStatus(data.status);
          if (data.status === 'completed') {
            queryClient.invalidateQueries({ queryKey: ['patient', 'ambulance-requests', 'active'] });
          }
        }
      },
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setConnectionStatus('disconnected');
      setLocationStale(false);
    };
  }, [tripId]);

  useEffect(() => {
    setTripStatus(statusFromApi);
  }, [statusFromApi]);

  // When connected, consider location stale if no update for LOCATION_STALE_MS
  useEffect(() => {
    if (connectionStatus !== 'connected') {
      setLocationStale(false);
      return;
    }
    const t = setInterval(() => {
      const last = lastLocationTimeRef.current;
      if (last && Date.now() - last > LOCATION_STALE_MS) setLocationStale(true);
    }, 15000);
    return () => clearInterval(t);
  }, [connectionStatus]);

  return {
    trip,
    location,
    tripStatus: tripStatus ?? statusFromApi,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    locationStale,
    isLoading: tripLoading,
    refetchTrip,
  };
}
