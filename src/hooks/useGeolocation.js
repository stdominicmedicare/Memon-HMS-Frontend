/**
 * Browser geolocation via navigator.geolocation.watchPosition.
 * Returns live position updates (latitude, longitude, speed, heading, accuracy, error).
 */
import { useState, useEffect, useRef } from 'react';

const DEFAULT_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 10000,
};

/**
 * @param {boolean} [enabled=true] - start watching when true
 * @param {{ enableHighAccuracy?: boolean, maximumAge?: number, timeout?: number }} [options] - watchPosition options
 * @returns {{ latitude: number | null, longitude: number | null, speed: number | null, heading: number | null, accuracy: number | null, error: string | null }}
 */
export function useGeolocation(enabled = true, options = {}) {
  const [state, setState] = useState({
    latitude: null,
    longitude: null,
    speed: null,
    heading: null,
    accuracy: null,
    error: null,
  });
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!enabled || !navigator?.geolocation) {
      if (!navigator?.geolocation && enabled) {
        setState((s) => ({ ...s, error: 'Geolocation not supported' }));
      }
      return;
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = position.coords;
        setState({
          latitude: coords.latitude,
          longitude: coords.longitude,
          speed: coords.speed != null ? coords.speed * 3.6 : null,
          heading: coords.heading != null && !Number.isNaN(coords.heading) ? coords.heading : null,
          accuracy: coords.accuracy ?? null,
          error: null,
        });
      },
      (err) => {
        const message =
          err.code === 1 ? 'Permission denied' : err.code === 2 ? 'Position unavailable' : err.code === 3 ? 'Timeout' : err.message || 'Unknown error';
        setState((s) => ({
          ...s,
          error: message,
        }));
      },
      opts
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled]);

  return state;
}
