/**
 * Admin fleet tracking: fetch fleet status, subscribe to all active trip channels.
 * Returns ambulances with live location for those on trip, and stats.
 */
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToTrip } from '../../../services/realtimeService';
import { useFleetStatus } from '../../../hooks/useAdminAmbulanceApi';

/** Default depot for ambulances without GPS (Available / Returning / Offline / Maintenance). */
export const FLEET_DEPOT = { lat: 40.7128, lng: -74.006 };

/** Parse current_location string to { lat, lng } if it looks like coordinates. */
function parseCurrentLocation(current_location) {
  if (!current_location || typeof current_location !== 'string') return null;
  const trimmed = current_location.trim();
  let lat; let lng;
  if (trimmed.startsWith('{')) {
    try {
      const o = JSON.parse(trimmed);
      lat = typeof o.lat === 'number' ? o.lat : parseFloat(o.lat);
      lng = typeof o.lng === 'number' ? o.lng : parseFloat(o.lng);
    } catch {
      return null;
    }
  } else {
    const parts = trimmed.split(/[,;\s]+/);
    if (parts.length >= 2) {
      lat = parseFloat(parts[0]);
      lng = parseFloat(parts[1]);
    } else return null;
  }
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

/**
 * @returns {{
 *   vehicles: Array<{ ambulanceId: string, vehicle_number: string, status: 'Available'|'On Duty'|'On Trip', tripId: string|null, location: { lat: number, lng: number }|null, tripStatus: string|null, trip: object|null }>,
 *   stats: { totalAmbulances, available, onDuty, activeTripsCount, returning },
 *   locationsByTripId: Record<string, { lat, lng }>,
 *   statusByTripId: Record<string, string>,
 *   activeTrips: Array,
 *   isLoading: boolean,
 *   refetch: function
 * }}
 */
export function useFleetTracking() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useFleetStatus();
  const [locationsByTripId, setLocationsByTripId] = useState({});
  const [statusByTripId, setStatusByTripId] = useState({});
  const unsubscribesRef = useRef({});

  const ambulances = data?.ambulances ?? [];
  const activeTrips = data?.activeTrips ?? [];
  const stats = data?.stats ?? {
    totalAmbulances: 0,
    available: 0,
    onDuty: 0,
    activeTripsCount: 0,
    returning: 0,
  };

  useEffect(() => {
    const tripIds = activeTrips.map((t) => t.id).filter(Boolean);
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
      const trip = activeTrips.find((t) => t.id === tripId);
      setStatusByTripId((s) => ({ ...s, [tripId]: trip?.status ?? null }));

      unsubscribesRef.current[tripId] = subscribeToTrip(tripId, {
        onLocation: (loc) => {
          setLocationsByTripId((prev) => ({
            ...prev,
            [tripId]: { lat: loc.lat, lng: loc.lng, speed: loc.speed, timestamp: loc.timestamp },
          }));
        },
        onStatus: (payload) => {
          if (payload?.status) {
            setStatusByTripId((prev) => ({ ...prev, [tripId]: payload.status }));
            if (payload.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: ['admin', 'fleet-status'] });
            }
          }
        },
      });
    });

    return () => {
      Object.values(unsubscribesRef.current).forEach((fn) => fn?.());
      unsubscribesRef.current = {};
    };
  }, [activeTrips, queryClient]);

  const onTripByAmbulanceId = {};
  activeTrips.forEach((t) => {
    if (t.ambulance_id) onTripByAmbulanceId[t.ambulance_id] = t;
  });

  const vehicles = ambulances.map((amb) => {
    const trip = onTripByAmbulanceId[amb.id];
    const tripId = trip?.id ?? null;
    const tripStatus = tripId ? statusByTripId[tripId] ?? trip?.status : null;
    const location = tripId && locationsByTripId[tripId]
      ? { lat: locationsByTripId[tripId].lat, lng: locationsByTripId[tripId].lng }
      : parseCurrentLocation(amb.current_location);
    const statusLabel = tripId
      ? 'On Trip'
      : amb.status === 'Available'
        ? 'Available'
        : amb.status === 'On Duty'
          ? 'Returning'
          : amb.status === 'Maintenance'
            ? 'Maintenance'
            : 'Offline';
    return {
      ambulanceId: amb.id,
      vehicle_number: amb.vehicle_number,
      status: statusLabel,
      rawStatus: amb.status,
      tripId,
      location,
      tripStatus,
      trip: trip || null,
      driver: amb.driver || null,
      last_completed_at: amb.last_completed_at || null,
    };
  });

  return {
    vehicles,
    stats,
    locationsByTripId,
    statusByTripId,
    activeTrips,
    isLoading,
    refetch,
  };
}
