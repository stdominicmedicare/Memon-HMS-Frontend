/**
 * Driver map: current location (ambulance marker), destination marker, optional route line.
 */
import { useMemo } from 'react';
import L from 'leaflet';
import { Marker, useMap } from 'react-leaflet';
import { BaseMap, AmbulanceMarker, RoutePolyline } from '../../../components/map';

function ChangeView({ center, zoom }) {
  const map = useMap();
  if (center && center.length >= 2) {
    map.setView(center, zoom ?? map.getZoom());
  }
  return null;
}

const destinationIcon = L.divIcon({
  className: 'destination-marker',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: '<div style="width:28px;height:28px;border-radius:50%;background:#0d9488;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)">B</div>',
});

export default function AmbulanceTrackingMap({
  driverPosition,
  destination,
  routePath = [],
  center,
  zoom = 14,
  className = 'h-[320px] w-full rounded-lg overflow-hidden border border-border',
}) {
  const mapCenter = useMemo(() => {
    if (driverPosition?.latitude != null && driverPosition?.longitude != null) {
      return [driverPosition.latitude, driverPosition.longitude];
    }
    if (destination?.lat != null && destination?.lng != null) {
      return [destination.lat, destination.lng];
    }
    return center || [40.7128, -74.006];
  }, [driverPosition?.latitude, driverPosition?.longitude, destination?.lat, destination?.lng, center]);

  const destPos =
    destination?.lat != null && destination?.lng != null
      ? [destination.lat, destination.lng]
      : null;

  return (
    <div className={`overflow-hidden ${className}`}>
      <BaseMap center={mapCenter} zoom={zoom} className="h-full w-full min-h-0">
        <ChangeView center={mapCenter} zoom={zoom} />
        {driverPosition?.latitude != null && driverPosition?.longitude != null && (
          <AmbulanceMarker
            position={[driverPosition.latitude, driverPosition.longitude]}
            heading={driverPosition.heading ?? 0}
          />
        )}
        {destPos && <Marker position={destPos} icon={destinationIcon} title="Destination" />}
        {routePath.length > 0 && <RoutePolyline path={routePath} />}
      </BaseMap>
    </div>
  );
}
