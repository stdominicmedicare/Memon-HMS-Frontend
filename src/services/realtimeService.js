/**
 * Supabase Realtime wrapper for live ambulance tracking.
 * Channel: ambulance_trip_{tripId}. Driver broadcasts location; others subscribe (read-only).
 */
import { supabase } from './supabase';

const EVENT_LOCATION = 'location';
const EVENT_STATUS = 'status';

/**
 * Create a Realtime channel for a trip. Caller must call .subscribe() before sending or receiving.
 * @param {string} tripId - ambulance_requests.id
 * @returns {import('@supabase/supabase-js').RealtimeChannel}
 */
export function createTrackingChannel(tripId) {
  const name = `ambulance_trip_${tripId}`;
  return supabase.channel(name);
}

/**
 * Broadcast current location on a channel. Channel must be subscribed (e.g. after startTracking).
 * @param {import('@supabase/supabase-js').RealtimeChannel} channel
 * @param {{ lat: number, lng: number, speed?: number, timestamp?: string }} data
 */
export function broadcastLocation(channel, data) {
  channel.send({
    type: 'broadcast',
    event: EVENT_LOCATION,
    payload: {
      lat: data.lat,
      lng: data.lng,
      speed: data.speed ?? null,
      timestamp: data.timestamp ?? new Date().toISOString(),
    },
  });
}

/**
 * Subscribe to location updates on a channel. Call after createTrackingChannel(tripId).
 * @param {import('@supabase/supabase-js').RealtimeChannel} channel
 * @param {(data: { lat: number, lng: number, speed?: number, timestamp?: string }) => void} callback
 * @returns {() => void} unsubscribe function (removes channel)
 */
export function subscribeToLocation(channel, callback) {
  const handler = (payload) => {
    if (payload?.payload) callback(payload.payload);
  };

  channel.on('broadcast', { event: EVENT_LOCATION }, handler);

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      // Optional: notify that we're ready to receive
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Create channel and subscribe to location updates in one call. Useful for viewers.
 * @param {string} tripId
 * @param {(data: { lat: number, lng: number, speed?: number, timestamp?: string }) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribeToTripLocation(tripId, callback) {
  const channel = createTrackingChannel(tripId);
  return subscribeToLocation(channel, callback);
}

/**
 * Subscribe to both location and status on a trip channel (for patient/viewer).
 * @param {string} tripId
 * @param {{ onLocation: (data) => void, onStatus: (data: { status: string, timestamp?: string }) => void }} handlers
 * @returns {() => void} unsubscribe
 */
export function subscribeToTrip(tripId, { onLocation, onStatus }) {
  const channel = createTrackingChannel(tripId);
  if (onLocation) {
    channel.on('broadcast', { event: EVENT_LOCATION }, (payload) => {
      if (payload?.payload) onLocation(payload.payload);
    });
  }
  if (onStatus) {
    channel.on('broadcast', { event: EVENT_STATUS }, (payload) => {
      if (payload?.payload) onStatus(payload.payload);
    });
  }
  channel.subscribe();
  return () => supabase.removeChannel(channel);
}

/**
 * Start broadcasting location as driver. Subscribes to channel, returns broadcast + unsubscribe.
 * Call after POST /api/tracking/start. Broadcast every ~5s with current GPS.
 * @param {string} tripId
 * @returns {Promise<{ broadcast: (data: { lat: number, lng: number, speed?: number }) => void, unsubscribe: () => void }>}
 */
export function startBroadcasting(tripId) {
  const channel = createTrackingChannel(tripId);

  return new Promise((resolve, reject) => {
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      resolve({
        broadcast: (data) => broadcastLocation(channel, data),
        broadcastStatus: (data) => {
          channel.send({
            type: 'broadcast',
            event: EVENT_STATUS,
            payload: { status: data.status ?? data, timestamp: new Date().toISOString() },
          });
        },
        unsubscribe: () => supabase.removeChannel(channel),
      });
    }
    if (status === 'CHANNEL_ERROR') {
      reject(new Error('Failed to subscribe to tracking channel'));
    }
  });
});
}
