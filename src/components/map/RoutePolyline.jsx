/**
 * Blue route line connecting a list of [lat, lng] points (e.g. from OSRM).
 */
import { Polyline } from 'react-leaflet';

const DEFAULT_OPTIONS = {
  color: '#2563eb',
  weight: 5,
  opacity: 0.8,
};

export default function RoutePolyline({ path = [], pathOptions = {} }) {
  const positions = Array.isArray(path) && path.length > 0
    ? path.map((p) => (Array.isArray(p) ? p : [p.lat, p.lng]))
    : [];

  if (positions.length < 2) return null;

  return (
    <Polyline
      positions={positions}
      pathOptions={{ ...DEFAULT_OPTIONS, ...pathOptions }}
    />
  );
}
