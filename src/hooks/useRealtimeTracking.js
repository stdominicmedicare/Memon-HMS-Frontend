/**
 * Subscribes to ambulance trip location updates via Supabase Realtime.
 * Returns current location, connection status, and last update time.
 */
import { useState, useEffect, useRef } from 'react';
import { subscribeToTripLocation } from '../services/realtimeService';

/**
 * @param {string | null} tripId - ambulance_requests.id; null to skip subscription
 * @returns {{ location: { lat: number, lng: number, speed?: number, timestamp?: string } | null, status: string, isConnected: boolean }}
 */
export function useRealtimeTracking(tripId) {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'error'
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!tripId || typeof tripId !== 'string') {
      setLocation(null);
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');

    unsubscribeRef.current = subscribeToTripLocation(tripId, (data) => {
      setLocation({
        lat: data.lat,
        lng: data.lng,
        speed: data.speed ?? undefined,
        timestamp: data.timestamp,
      });
      setStatus('connected');
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setLocation(null);
      setStatus('disconnected');
    };
  }, [tripId]);

  return {
    location,
    status,
    isConnected: status === 'connected',
  };
}
