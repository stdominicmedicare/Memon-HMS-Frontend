/**
 * Phase 1: Simple test map + shared components & hooks demo. Used at /map-test.
 */
import { BaseMap, AmbulanceMarker, RoutePolyline, ETADisplay } from './index';
import { useNominatim } from '../../hooks/useNominatim';
import { useOSRM } from '../../hooks/useOSRM';

const DEFAULT_CENTER = [40.7128, -74.006];
const DEFAULT_ZOOM = 13;

export default function TestMap() {
  const testAddress = 'Times Square, New York';
  const { lat, lng, loading: geoLoading, error: geoError } = useNominatim(testAddress);
  const from = lat != null && lng != null ? { lat, lng } : null;
  const to = { lat: 40.7589, lng: -73.9851 };
  const { route, durationSeconds, distanceMeters, isLoading: routeLoading, error: routeError } = useOSRM(
    from && to ? { from, to } : null
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        Phase 1: Leaflet + shared map components. Below: BaseMap, AmbulanceMarker, RoutePolyline, ETADisplay + useNominatim / useOSRM.
      </p>

      <div className="h-[480px] w-full overflow-hidden rounded-lg border border-border bg-surface relative">
        <BaseMap center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full min-h-0">
          <AmbulanceMarker position={DEFAULT_CENTER} heading={45} />
          {route.length > 0 && <RoutePolyline path={route} />}
        </BaseMap>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
        <h2 className="font-semibold text-text-primary">Hooks demo (React Query + cache)</h2>
        <p className="text-sm text-text-secondary">
          Geocode &quot;{testAddress}&quot;: {geoLoading ? 'Loading…' : geoError ? `Error: ${geoError.message}` : lat != null ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : '—'}
        </p>
        <p className="text-sm text-text-secondary">
          Route to Central Park: {routeLoading ? 'Loading…' : routeError ? `Error: ${routeError.message}` : route.length > 0 ? `${(distanceMeters / 1000).toFixed(2)} km, ${Math.ceil(durationSeconds / 60)} min` : '—'}
        </p>
        <ETADisplay durationSeconds={durationSeconds} label="ETA:" className="text-sm" />
      </div>
    </div>
  );
}
