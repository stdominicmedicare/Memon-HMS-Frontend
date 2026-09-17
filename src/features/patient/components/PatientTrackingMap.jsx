/**
 * Full-screen patient tracking map: ambulance (live), patient location, destination, route, ETA.
 * Route and ETA recalc every 30s. "Ambulance is close!" when ETA < 2 min.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BaseMap, AmbulanceMarker, PatientMarker, RoutePolyline, ETADisplay } from '../../../components/map';
import { useNominatim } from '../../../hooks/useNominatim';
import { useOSRM } from '../../../hooks/useOSRM';
import { useGeolocation } from '../../../hooks/useGeolocation';

const ROUTE_REFETCH_MS = 30 * 1000;

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center?.length >= 2) map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

const destinationIcon = L.divIcon({
  className: 'destination-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: '<div style="width:28px;height:28px;border-radius:50%;background:#dc2626;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)">B</div>',
});

export default function PatientTrackingMap({
  trip,
  ambulanceLocation,
  /** Live status from Realtime (overrides trip.status for route/ETA). */
  tripStatus: tripStatusProp,
  className = 'h-[45vh] min-h-[240px] w-full rounded-lg overflow-hidden border border-border sm:h-[70vh] sm:min-h-[320px]',
}) {
  const fromAddress = trip?.from_address ?? '';
  const toAddress = trip?.to_address ?? '';
  const tripStatus = tripStatusProp ?? trip?.status ?? '';

  const { lat: fromLat, lng: fromLng } = useNominatim(fromAddress);
  const { lat: toLat, lng: toLng } = useNominatim(toAddress);
  const { latitude: myLat, longitude: myLng } = useGeolocation(!!trip);

  const patientPoint = useMemo(() => {
    if (myLat != null && myLng != null) return { lat: myLat, lng: myLng };
    if (fromLat != null && fromLng != null) return { lat: fromLat, lng: fromLng };
    return null;
  }, [myLat, myLng, fromLat, fromLng]);

  const destinationPoint = useMemo(() => {
    if (toLat != null && toLng != null) return { lat: toLat, lng: toLng };
    return null;
  }, [toLat, toLng]);

  const ambulancePoint = useMemo(() => {
    if (ambulanceLocation?.lat != null && ambulanceLocation?.lng != null) {
      return { lat: ambulanceLocation.lat, lng: ambulanceLocation.lng };
    }
    return null;
  }, [ambulanceLocation?.lat, ambulanceLocation?.lng]);

  const isEnRouteToPatient = tripStatus === 'en_route' || tripStatus === 'arrived';
  const fromForRoute = ambulancePoint;
  const toForRoute = isEnRouteToPatient ? patientPoint : destinationPoint;

  const { route, durationSeconds, refetch: refetchRoute } = useOSRM(
    fromForRoute && toForRoute ? { from: fromForRoute, to: toForRoute } : null
  );

  const [etaSeconds, setEtaSeconds] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setEtaSeconds(durationSeconds ?? null);
  }, [durationSeconds]);

  useEffect(() => {
    if (!fromForRoute || !toForRoute) return;
    intervalRef.current = setInterval(() => refetchRoute(), ROUTE_REFETCH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fromForRoute, toForRoute, refetchRoute]);

  const mapCenter = useMemo(() => {
    if (ambulancePoint) return [ambulancePoint.lat, ambulancePoint.lng];
    if (patientPoint) return [patientPoint.lat, patientPoint.lng];
    if (destinationPoint) return [destinationPoint.lat, destinationPoint.lng];
    return [40.7128, -74.006];
  }, [ambulancePoint, patientPoint, destinationPoint]);

  const isClose = (etaSeconds ?? durationSeconds ?? 0) <= 120;

  return (
    <div className={`overflow-hidden rounded-lg ${className} ${isClose ? 'ambulance-marker-pulse' : ''}`}>
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 rounded-t-lg border-b border-border bg-surface/95 px-3 py-2 backdrop-blur sm:px-4">
        <ETADisplay
          durationSeconds={etaSeconds ?? durationSeconds}
          label="Arriving in"
          className="text-lg font-medium"
        />
        {isClose && (
          <span className="animate-pulse rounded-full bg-success/20 px-3 py-1 text-sm font-semibold text-success">
            Ambulance is close!
          </span>
        )}
      </div>
      <BaseMap center={mapCenter} zoom={14} className="h-[calc(100%-52px)] w-full min-h-0">
        <ChangeView center={mapCenter} zoom={14} />
        {ambulancePoint && (
          <AmbulanceMarker position={[ambulancePoint.lat, ambulancePoint.lng]} />
        )}
        {patientPoint && <PatientMarker position={[patientPoint.lat, patientPoint.lng]} title="You" />}
        {destinationPoint && (
          <Marker position={[destinationPoint.lat, destinationPoint.lng]} icon={destinationIcon} title="Destination" />
        )}
        {route.length > 0 && <RoutePolyline path={route} />}
      </BaseMap>
    </div>
  );
}
