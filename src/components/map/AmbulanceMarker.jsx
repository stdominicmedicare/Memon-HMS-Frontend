/**
 * Ambulance marker: side-view ambulance (white body, red stripe, red cross, siren, blue windows).
 * Used everywhere the ambulance location is shown on the map.
 */
import { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';

const DEFAULT_SIZE = 40;

export function createAmbulanceIcon(heading = 0, options = {}) {
  const size = options.size ?? DEFAULT_SIZE;
  const anchor = size / 2;
  const opacity = options.opacity ?? 1;
  const extraClass = options.className ?? '';
  return L.divIcon({
    className: `ambulance-marker-icon ${extraClass}`.trim(),
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        display: flex; align-items: center; justify-content: center;
        transform: rotate(${heading}deg);
        transition: transform 0.3s ease-out;
        background: transparent; border: none;
        opacity: ${opacity};
      ">
        <svg width="${Math.round(size * 0.9)}" height="${Math.round(size * 0.6)}" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Main body (boxy ambulance side) -->
          <rect x="1" y="9" width="34" height="12" rx="1" fill="white" stroke="#374151" stroke-width="1"/>
          <!-- Red horizontal stripe -->
          <rect x="1" y="15" width="34" height="3" fill="#dc2626"/>
          <!-- Red cross on rear -->
          <rect x="22" y="11" width="10" height="2" fill="#dc2626"/>
          <rect x="26" y="9" width="2" height="8" fill="#dc2626"/>
          <!-- Cabin front (angled) -->
          <path d="M1 9 L1 21 L9 21 L9 12 L12 9 Z" fill="white" stroke="#374151" stroke-width="1"/>
          <!-- Windows - light blue -->
          <rect x="3" y="10.5" width="5" height="3" rx="0.3" fill="#93c5fd" stroke="#374151" stroke-width="0.5"/>
          <rect x="14" y="10.5" width="6" height="2.5" rx="0.3" fill="#93c5fd" stroke="#374151" stroke-width="0.5"/>
          <!-- Siren on roof -->
          <rect x="6" y="6" width="10" height="2.5" rx="0.5" fill="#dc2626" stroke="#374151" stroke-width="0.5"/>
          <line x1="8" y1="7" x2="8" y2="8.2" stroke="white" stroke-width="0.4"/>
          <line x1="11" y1="7" x2="11" y2="8.2" stroke="white" stroke-width="0.4"/>
          <line x1="14" y1="7" x2="14" y2="8.2" stroke="white" stroke-width="0.4"/>
          <!-- Wheels -->
          <circle cx="9" cy="21" r="2.2" fill="#4b5563" stroke="#374151" stroke-width="0.6"/>
          <circle cx="9" cy="21" r="1" fill="#9ca3af"/>
          <circle cx="27" cy="21" r="2.2" fill="#4b5563" stroke="#374151" stroke-width="0.6"/>
          <circle cx="27" cy="21" r="1" fill="#9ca3af"/>
        </svg>
      </div>
    `,
  });
}

export default function AmbulanceMarker({ position, heading = 0, highlight, faded }) {
  const icon = useMemo(() => {
    const options = {};
    if (highlight) {
      options.size = 56;
      options.className = 'ambulance-marker-assigned';
    }
    if (faded) options.opacity = 0.45;
    return createAmbulanceIcon(heading, options);
  }, [heading, highlight, faded]);

  if (!position || position.length < 2) return null;

  const latLng = Array.isArray(position) ? position : [position.lat, position.lng];

  return <Marker position={latLng} icon={icon} zIndexOffset={1000} />;
}
