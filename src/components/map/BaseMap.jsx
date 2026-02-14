/**
 * Reusable Leaflet map: OSM tiles, configurable center/zoom.
 * Wrapped in a contained div so the map never overlaps other content.
 */
import { MapContainer, TileLayer } from 'react-leaflet';

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function BaseMap({
  center = [40.7128, -74.006],
  zoom = 13,
  className = 'h-full w-full',
  children,
  scrollWheelZoom = true,
  ...rest
}) {
  return (
    <div className={`map-container overflow-hidden relative min-h-0 ${className}`} style={{ isolation: 'isolate' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="map-container-inner h-full w-full"
        scrollWheelZoom={scrollWheelZoom}
        {...rest}
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_URL} />
        {children}
      </MapContainer>
    </div>
  );
}
