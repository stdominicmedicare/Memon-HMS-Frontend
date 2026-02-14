/**
 * Doctor tracking: subscribe to transfer trip channels (ICU patients in ambulance).
 */
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToTrip } from '../../../services/realtimeService';
import { useDoctorTransferTrips } from '../../../hooks/useDoctorApi';

/**
 * Subscribes to all transfer trips' channels. Returns per-trip location and status.
 */
export function useDoctorTracking() {
  const queryClient = useQueryClient();
  const { data: trips = [], isLoading, refetch } = useDoctorTransferTrips();
  const [locationsByTripId, setLocationsByTripId] = useState({});
  const [statusByTripId, setStatusByTripId] = useState({});
  const unsubscribesRef = useRef({});

  useEffect(() => {
    const tripIds = trips.map((t) => t.id).filter(Boolean);
    const prevIds = Object.keys(unsubscribesRef.current);

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

    tripIds.forEach((tripId) => {
      if (unsubscribesRef.current[tripId]) return;
      const trip = trips.find((t) => t.id === tripId);
      setStatusByTripId((s) => ({ ...s, [tripId]: trip?.status ?? null }));

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
              queryClient.invalidateQueries({ queryKey: ['doctor', 'transfer-trips'] });
            }
          }
        },
      });
    });

    return () => {
      Object.values(unsubscribesRef.current).forEach((fn) => fn?.());
      unsubscribesRef.current = {};
    };
  }, [trips, queryClient]);

  return {
    trips,
    locationsByTripId,
    statusByTripId,
    isLoading,
    refetch,
  };
}
