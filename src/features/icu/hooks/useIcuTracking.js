/**
 * ICU tracking: subscribe to multiple trip Realtime channels (incoming patients).
 * API already filters to approved ICU admissions with active ambulance trip.
 */
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToTrip } from '../../../services/realtimeService';
import { useIcuIncomingPatients } from '../../../hooks/useIcuApi';

/**
 * Subscribes to all incoming patients' trip channels. Returns per-trip location and status.
 * @returns { incoming, locationsByTripId, statusByTripId, isLoading, refetch }
 * - incoming: array from API (approved ICU + active trip)
 * - locationsByTripId: { [tripId]: { lat, lng, speed?, timestamp? } }
 * - statusByTripId: { [tripId]: string }
 */
export function useIcuTracking() {
  const queryClient = useQueryClient();
  const { data: incoming = [], isLoading, refetch } = useIcuIncomingPatients();
  const [locationsByTripId, setLocationsByTripId] = useState({});
  const [statusByTripId, setStatusByTripId] = useState({});
  const unsubscribesRef = useRef({});

  useEffect(() => {
    const tripIds = incoming.map((t) => t.id).filter(Boolean);
    const prevIds = Object.keys(unsubscribesRef.current);

    // Unsubscribe from removed trips and clear their state
    prevIds.forEach((id) => {
      if (!tripIds.includes(id)) {
        unsubscribesRef.current[id]?.();
        delete unsubscribesRef.current[id];
        setLocationsByTripId((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setStatusByTripId((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });

    // Subscribe to new trips
    tripIds.forEach((tripId) => {
      if (unsubscribesRef.current[tripId]) return;
      const trip = incoming.find((t) => t.id === tripId);
      const initialStatus = trip?.status ?? null;
      setStatusByTripId((s) => ({ ...s, [tripId]: initialStatus }));

      unsubscribesRef.current[tripId] = subscribeToTrip(tripId, {
        onLocation: (data) => {
          setLocationsByTripId((prev) => ({
            ...prev,
            [tripId]: { lat: data.lat, lng: data.lng, speed: data.speed, timestamp: data.timestamp },
          }));
        },
        onStatus: (data) => {
          if (data?.status) {
            setStatusByTripId((prev) => ({ ...prev, [tripId]: data.status }));
            if (data.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: ['icu', 'incoming-patients'] });
            }
          }
        },
      });
    });

    return () => {
      Object.values(unsubscribesRef.current).forEach((fn) => fn?.());
      unsubscribesRef.current = {};
    };
  }, [incoming, queryClient]);

  return {
    incoming,
    locationsByTripId,
    statusByTripId,
    isLoading,
    refetch,
  };
}
