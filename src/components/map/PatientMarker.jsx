/**
 * Patient marker: person with medical cross (head + torso + white plus).
 * Used everywhere the patient location is shown on the map.
 */
import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

const SIZE = 32;
const ANCHOR = SIZE / 2;

const patientIcon = L.divIcon({
  className: 'patient-marker',
  iconSize: [SIZE, SIZE],
  iconAnchor: [ANCHOR, ANCHOR],
  html: `
    <div style="width:${SIZE}px;height:${SIZE}px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Head (dark grey) -->
        <circle cx="12" cy="5.5" r="3.5" fill="#334155" stroke="#1e293b" stroke-width="0.8"/>
        <!-- Torso / shoulders (royal blue) -->
        <ellipse cx="12" cy="15" rx="6" ry="8" fill="#2563eb" stroke="#1d4ed8" stroke-width="0.8"/>
        <!-- Medical cross on chest (white plus) -->
        <path d="M12 11 L12 17 M9 14 L15 14" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </div>
  `,
});

export default function PatientMarker({ position, title = 'Patient' }) {
  if (!position || (Array.isArray(position) && position.length < 2)) return null;
  const latLng = Array.isArray(position) ? position : [position.lat, position.lng];
  return <Marker position={latLng} icon={patientIcon} zIndexOffset={800} title={title} />;
}
