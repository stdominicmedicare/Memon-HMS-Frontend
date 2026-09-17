/**
 * Driver fleet map: YOU (blue, large) + all other ambulances (green/red/yellow/gray), hospitals.
 * Click other markers for driver name, status, trip from/to. Center on Me button.
 */
import { useMemo, useState, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BaseMap } from '../../../components/map';
import { useAmbulanceFleetView } from '../../../hooks/useAmbulanceApi';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { PATIENT_MAP_HOSPITALS } from '../../../utils/constants';

const DEFAULT_CENTER = [40.7128, -74.006];
const MARKER_SIZE = 28;
const ANCHOR = MARKER_SIZE / 2;

function createFleetIcon(color, label) {
  return L.divIcon({
    className: 'fleet-marker',
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [ANCHOR, ANCHOR],
    html: `
      <div style="
        width: ${MARKER_SIZE}px; height: ${MARKER_SIZE}px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: #fff;
        text-shadow: 0 0 1px #000;
      ">${label}</div>
    `,
  });
}

const ICON_GREEN = createFleetIcon('#22c55e', 'A');
const ICON_RED = createFleetIcon('#dc2626', 'T');
const ICON_YELLOW = createFleetIcon('#eab308', 'R');
const ICON_GRAY = createFleetIcon('#6b7280', 'O');

const YOU_SIZE = 44;
const youIcon = L.divIcon({
  className: 'driver-you-marker',
  iconSize: [YOU_SIZE, YOU_SIZE],
  iconAnchor: [YOU_SIZE / 2, YOU_SIZE / 2],
  html: `
    <div style="
      width: ${YOU_SIZE}px; height: ${YOU_SIZE}px;
      border-radius: 50%;
      background: #2563eb;
      border: 4px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: bold;
      color: #fff;
      text-align: center;
      line-height: 1.1;
      padding: 2px;
    ">YOU</div>
  `,
});

const hospitalIcon = L.divIcon({
  className: 'hospital-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  html: '<div style="width:24px;height:24px;border-radius:4px;background:#0d9488;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;border:2px solid #fff;">H</div>',
});

function getStatusLabel(amb) {
  if (amb.trip) return 'On Trip';
  if (amb.status === 'Available') return 'Available';
  if (amb.status === 'On Duty') return 'Returning';
  if (amb.status === 'Maintenance') return 'Maintenance';
  return 'Offline';
}

function getIcon(amb) {
  const label = getStatusLabel(amb);
  if (label === 'Available') return ICON_GREEN;
  if (label === 'On Trip') return ICON_RED;
  if (label === 'Returning') return ICON_YELLOW;
  return ICON_GRAY;
}

function ChangeView({ center, zoom }) {
  const map = useMap();
  if (center?.length >= 2) map.setView(center, zoom ?? map.getZoom());
  return null;
}

function CenterOnMeButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary shadow hover:bg-surface-muted disabled:opacity-50"
    >
      Center on Me
    </button>
  );
}

export default function DriverFleetMap({
  className = 'h-[40vh] min-h-[220px] w-full rounded-lg overflow-hidden border border-border sm:h-[55vh] sm:min-h-[360px]',
}) {
  const { data: fleetData, isLoading } = useAmbulanceFleetView();
  const { latitude: myLat, longitude: myLng } = useGeolocation(true);
  const [center, setCenter] = useState(null);

  const myAmbulanceId = fleetData?.myAmbulanceId ?? null;
  const ambulances = fleetData?.ambulances ?? [];
  const stats = fleetData?.stats ?? {};

  const myPosition = useMemo(() => {
    if (myLat != null && myLng != null) return { lat: myLat, lng: myLng };
    const me = ambulances.find((a) => a.id === myAmbulanceId);
    if (me) return { lat: me.lat, lng: me.lng };
    return null;
  }, [myLat, myLng, myAmbulanceId, ambulances]);

  const otherAmbulances = useMemo(
    () => ambulances.filter((a) => a.id !== myAmbulanceId),
    [ambulances, myAmbulanceId]
  );

  const mapCenter = useMemo(() => {
    if (center?.length >= 2) return center;
    if (myPosition) return [myPosition.lat, myPosition.lng];
    if (otherAmbulances.length > 0) {
      const lat = otherAmbulances.reduce((s, a) => s + a.lat, 0) / otherAmbulances.length;
      const lng = otherAmbulances.reduce((s, a) => s + a.lng, 0) / otherAmbulances.length;
      return [lat, lng];
    }
    return DEFAULT_CENTER;
  }, [center?.[0], center?.[1], myPosition?.lat, myPosition?.lng, otherAmbulances.length]);

  const handleCenterOnMe = () => {
    if (myPosition) setCenter([myPosition.lat, myPosition.lng]);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center rounded-lg border border-border bg-surface-muted ${className}`}>
        <p className="text-text-muted">Loading fleet map…</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border-b border-border bg-surface/95 px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold text-text-primary">
            Fleet Map – You & {otherAmbulances.length} other{otherAmbulances.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-blue-500" /> You
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-green-500" /> Available: {stats.available ?? 0}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500" /> On trip: {stats.onTrip ?? 0}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-yellow-500" /> Returning: {stats.returning ?? 0}
          </span>
        </div>
        <CenterOnMeButton onClick={handleCenterOnMe} disabled={!myPosition} />
      </div>
      <BaseMap center={mapCenter} zoom={12} className="h-[calc(100%-48px)] w-full min-h-0">
        <ChangeView center={mapCenter} zoom={12} />
        {myPosition && (
          <Marker position={[myPosition.lat, myPosition.lng]} icon={youIcon} zIndexOffset={2000} title="YOU ARE HERE">
            <Popup>
              <div className="text-sm font-semibold text-primary">YOU ARE HERE</div>
              <p className="text-text-secondary text-xs mt-0.5">Ambulance driver – your live position</p>
            </Popup>
          </Marker>
        )}
        {otherAmbulances.map((amb) => (
          <Marker
            key={amb.id}
            position={[amb.lat, amb.lng]}
            icon={getIcon(amb)}
            zIndexOffset={500}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <p className="font-semibold text-text-primary">Ambulance {amb.vehicle_number}</p>
                <p className="text-text-secondary">{amb.driver?.full_name ?? 'Driver'}</p>
                <p className="mt-1 font-medium">{getStatusLabel(amb)}</p>
                {amb.trip && (
                  <p className="mt-1 text-xs text-text-muted">
                    {amb.trip.from_address} → {amb.trip.to_address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {PATIENT_MAP_HOSPITALS.map((h, i) => (
          <Marker key={`h-${i}`} position={[h.lat, h.lng]} icon={hospitalIcon} title={h.name} />
        ))}
      </BaseMap>
    </div>
  );
}
