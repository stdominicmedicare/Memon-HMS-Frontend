/**
 * Always-visible patient map: awareness mode (no trip) vs tracking mode (active trip).
 * - No trip: patient location (blue pulse), nearby ambulances (green/gray), hospitals, "Request Ambulance".
 * - Active trip: assigned ambulance highlighted (big, pulse), route, ETA, driver card; other ambulances faded.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  BaseMap,
  AmbulanceMarker,
  PatientMarker,
  RoutePolyline,
  ETADisplay,
} from '../../../components/map';
import { useNominatim } from '../../../hooks/useNominatim';
import { useOSRM } from '../../../hooks/useOSRM';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { usePatientTracking } from '../hooks/usePatientTracking';
import { usePatientAmbulanceAvailability } from '../../../hooks/usePatientApi';
import { PATIENT_MAP_HOSPITALS } from '../../../utils/constants';
import DriverInfoCard from './DriverInfoCard';
import TripStatusBadge from './TripStatusBadge';

const ROUTE_REFETCH_MS = 30 * 1000;
const NEARBY_AMBULANCES_LIMIT = 5;
const DEFAULT_CENTER = [40.7128, -74.006];

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center?.length >= 2) map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

const hospitalIcon = L.divIcon({
  className: 'hospital-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: '<div style="width:28px;height:28px;border-radius:6px;background:#0d9488;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)">H</div>',
});

export default function PatientAmbulanceMap({ onRequestAmbulance, className = 'h-[45vh] min-h-[240px] w-full rounded-lg overflow-hidden border border-border sm:h-[70vh] sm:min-h-[320px]' }) {
  const { latitude: myLat, longitude: myLng } = useGeolocation(true);
  const { data: availabilityList = [] } = usePatientAmbulanceAvailability();
  const { trip: activeTrip, location: ambulanceLocation, tripStatus, connectionStatus, locationStale } = usePatientTracking();

  const fromAddress = activeTrip?.from_address ?? '';
  const toAddress = activeTrip?.to_address ?? '';
  const { lat: fromLat, lng: fromLng } = useNominatim(fromAddress);
  const { lat: toLat, lng: toLng } = useNominatim(toAddress);

  const patientPoint = useMemo(() => {
    if (myLat != null && myLng != null) return { lat: myLat, lng: myLng };
    if (fromLat != null && fromLng != null) return { lat: fromLat, lng: fromLng };
    return null;
  }, [myLat, myLng, fromLat, fromLng]);

  const assignedAmbulancePoint = useMemo(() => {
    if (ambulanceLocation?.lat != null && ambulanceLocation?.lng != null)
      return { lat: ambulanceLocation.lat, lng: ambulanceLocation.lng };
    return null;
  }, [ambulanceLocation?.lat, ambulanceLocation?.lng]);

  const destinationPoint = useMemo(() => {
    if (toLat != null && toLng != null) return { lat: toLat, lng: toLng };
    return null;
  }, [toLat, toLng]);

  const isEnRouteToPatient = tripStatus === 'en_route' || tripStatus === 'arrived';
  const fromForRoute = assignedAmbulancePoint;
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

  const nearbyAmbulances = useMemo(() => {
    if (!patientPoint || availabilityList.length === 0) return [];
    const withDist = availabilityList.map((a) => ({
      ...a,
      distanceKm: haversineKm(patientPoint.lat, patientPoint.lng, a.lat, a.lng),
    }));
    withDist.sort((a, b) => a.distanceKm - b.distanceKm);
    return withDist.slice(0, NEARBY_AMBULANCES_LIMIT);
  }, [patientPoint, availabilityList]);

  const assignedAmbulanceId = activeTrip?.ambulance_id ?? null;
  const isTracking = !!activeTrip;
  const isClose = (etaSeconds ?? durationSeconds ?? 0) <= 120;

  const mapCenter = useMemo(() => {
    if (isTracking && assignedAmbulancePoint) return [assignedAmbulancePoint.lat, assignedAmbulancePoint.lng];
    if (patientPoint) return [patientPoint.lat, patientPoint.lng];
    return DEFAULT_CENTER;
  }, [isTracking, assignedAmbulancePoint, patientPoint]);

  return (
    <div className={`overflow-hidden rounded-lg ${className} ${isTracking && isClose ? 'ambulance-marker-pulse' : ''} ${patientPoint ? 'patient-marker-pulse' : ''}`}>
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 rounded-t-lg border-b border-border bg-surface/95 px-3 py-2 backdrop-blur sm:px-4">
        {isTracking ? (
          <>
            <ETADisplay durationSeconds={etaSeconds ?? durationSeconds} label="Arriving in" className="text-lg font-medium" />
            {isClose && (
              <span className="animate-pulse rounded-full bg-success/20 px-3 py-1 text-sm font-semibold text-success">
                Ambulance is close!
              </span>
            )}
            <TripStatusBadge tripStatus={tripStatus} />
          </>
        ) : (
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-text-secondary">Your location · Nearby ambulances</span>
            {typeof onRequestAmbulance === 'function' && (
              <button
                type="button"
                onClick={onRequestAmbulance}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Request Ambulance
              </button>
            )}
          </div>
        )}
      </div>

      <BaseMap center={mapCenter} zoom={14} className="h-[calc(100%-52px)] w-full min-h-0">
        <ChangeView center={mapCenter} zoom={14} />
        {patientPoint && <PatientMarker position={[patientPoint.lat, patientPoint.lng]} title="You" />}

        {isTracking ? (
          <>
            {assignedAmbulancePoint && (
              <AmbulanceMarker position={[assignedAmbulancePoint.lat, assignedAmbulancePoint.lng]} highlight />
            )}
            {destinationPoint && (
              <Marker position={[destinationPoint.lat, destinationPoint.lng]} icon={hospitalIcon} title="Destination" />
            )}
            {route?.length > 0 && <RoutePolyline path={route} />}
            {nearbyAmbulances
              .filter((a) => a.id !== assignedAmbulanceId)
              .map((a) => (
                <AmbulanceMarker key={a.id} position={[a.lat, a.lng]} faded />
              ))}
          </>
        ) : (
          <>
            {nearbyAmbulances.map((a) => (
              <AmbulanceMarker
                key={a.id}
                position={[a.lat, a.lng]}
                faded={a.status !== 'Available'}
              />
            ))}
            {PATIENT_MAP_HOSPITALS.map((h, i) => (
              <Marker key={i} position={[h.lat, h.lng]} icon={hospitalIcon} title={h.name} />
            ))}
          </>
        )}
      </BaseMap>

      {isTracking && activeTrip && (
        <div className="border-t border-border bg-surface/95 px-3 py-2 sm:px-4">
          <DriverInfoCard driver={activeTrip.driver} ambulance={activeTrip.ambulance} />
        </div>
      )}
      {isTracking && connectionStatus === 'connecting' && (
        <p className="px-3 py-1 text-sm text-text-muted">Connecting to live location…</p>
      )}
      {isTracking && connectionStatus === 'connected' && !ambulanceLocation && !locationStale && (
        <p className="px-3 py-1 text-sm text-text-muted">Waiting for driver location…</p>
      )}
      {isTracking && locationStale && (
        <p className="px-3 py-1 text-sm text-amber-600">Driver location temporarily unavailable. Reconnecting…</p>
      )}
    </div>
  );
}
