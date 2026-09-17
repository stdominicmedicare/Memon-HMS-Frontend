/**
 * Fleet map: all ambulances with color-coded markers.
 * Green = Available, Red = On Trip, Yellow = Returning, Gray = Offline/Maintenance.
 * Filter toggles: Show all | Available only | Active trips only.
 */
import { useEffect, useMemo, useState } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BaseMap } from '../../../components/map';
import { createAmbulanceIcon } from '../../../components/map/AmbulanceMarker';
import { FLEET_DEPOT } from '../hooks/useFleetTracking';

const FILTER_ALL = 'all';
const FILTER_AVAILABLE = 'available';
const FILTER_ACTIVE = 'active';

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center?.length >= 2) map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

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
      " title="${label}">${label}</div>
    `,
  });
}

const ICON_GREEN = createFleetIcon('#22c55e', 'A');   // Available
const ICON_YELLOW = createFleetIcon('#eab308', 'R');  // Returning
const ICON_GRAY = createFleetIcon('#6b7280', 'O');    // Offline / Maintenance

export default function FleetTrackingMap({
  vehicles = [],
  stats,
  onVehicleClick,
  className = 'h-[45vh] min-h-[240px] w-full rounded-lg overflow-hidden border border-border sm:h-[60vh] sm:min-h-[400px]',
}) {
  const [filter, setFilter] = useState(FILTER_ALL);
  const { available, activeTripsCount, returning, offline, maintenance } = stats || {};
  const depotOffset = 0.0003;

  const filteredVehicles = useMemo(() => {
    if (filter === FILTER_AVAILABLE) return vehicles.filter((v) => v.status === 'Available');
    if (filter === FILTER_ACTIVE) return vehicles.filter((v) => v.status === 'On Trip');
    return vehicles;
  }, [vehicles, filter]);

  const onTripVehicles = useMemo(
    () => filteredVehicles.filter((v) => v.status === 'On Trip' && v.location),
    [filteredVehicles]
  );
  const depotMarkers = useMemo(() => {
    let availableIndex = 0;
    let returningIndex = 0;
    let grayIndex = 0;
    return filteredVehicles
      .filter((v) => v.status !== 'On Trip' || !v.location)
      .map((v) => {
        const useStoredLocation = v.location && v.status !== 'On Trip';
        let position;
        let icon;
        if (useStoredLocation) {
          position = [v.location.lat, v.location.lng];
        } else {
          if (v.status === 'Available') {
            position = [
              FLEET_DEPOT.lat + availableIndex * depotOffset,
              FLEET_DEPOT.lng + availableIndex * depotOffset,
            ];
            availableIndex++;
            icon = ICON_GREEN;
          } else if (v.status === 'Returning') {
            position = [
              FLEET_DEPOT.lat + 0.002 + returningIndex * depotOffset,
              FLEET_DEPOT.lng + returningIndex * depotOffset,
            ];
            returningIndex++;
            icon = ICON_YELLOW;
          } else {
            position = [
              FLEET_DEPOT.lat + 0.004 + grayIndex * depotOffset,
              FLEET_DEPOT.lng + grayIndex * depotOffset,
            ];
            grayIndex++;
            icon = ICON_GRAY;
          }
        }
        if (!icon) {
          icon = v.status === 'Available' ? ICON_GREEN : v.status === 'Returning' ? ICON_YELLOW : ICON_GRAY;
        }
        return { vehicle: v, position, icon };
      });
  }, [filteredVehicles]);

  const mapCenter = useMemo(() => {
    const withLocation = filteredVehicles.filter((v) => v.location);
    if (withLocation.length > 0) {
      const lat = withLocation.reduce((s, v) => s + v.location.lat, 0) / withLocation.length;
      const lng = withLocation.reduce((s, v) => s + v.location.lng, 0) / withLocation.length;
      return [lat, lng];
    }
    return [FLEET_DEPOT.lat, FLEET_DEPOT.lng];
  }, [filteredVehicles]);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border-b border-border bg-surface/95 px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-green-500" /> Available: {available ?? 0}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500" /> On trip: {activeTripsCount ?? 0}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-yellow-500" /> Returning: {returning ?? 0}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gray-500" /> Offline: {offline ?? 0}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-gray-400" /> Maintenance: {maintenance ?? 0}
          </span>
        </div>
        <div className="flex rounded-lg border border-border bg-surface p-0.5">
          <button
            type="button"
            onClick={() => setFilter(FILTER_ALL)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === FILTER_ALL ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-muted'}`}
          >
            Show all
          </button>
          <button
            type="button"
            onClick={() => setFilter(FILTER_AVAILABLE)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === FILTER_AVAILABLE ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-muted'}`}
          >
            Available only
          </button>
          <button
            type="button"
            onClick={() => setFilter(FILTER_ACTIVE)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${filter === FILTER_ACTIVE ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-muted'}`}
          >
            Active trips only
          </button>
        </div>
      </div>
      <BaseMap center={mapCenter} zoom={11} className="h-[calc(100%-44px)] w-full min-h-0">
        <ChangeView center={mapCenter} zoom={11} />
        {onTripVehicles.map((vehicle) => (
          <Marker
            key={vehicle.ambulanceId}
            position={[vehicle.location.lat, vehicle.location.lng]}
            icon={createAmbulanceIcon(0)}
            zIndexOffset={1000}
            eventHandlers={{
              click: () => onVehicleClick?.(vehicle),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Ambulance {vehicle.vehicle_number}</p>
                <p className="text-text-secondary">{vehicle.status}</p>
                {vehicle.trip && (
                  <p className="mt-1 text-text-muted">
                    Trip: {vehicle.tripStatus ?? vehicle.trip?.status}
                  </p>
                )}
                {onVehicleClick && (
                  <button
                    type="button"
                    className="mt-2 text-primary font-medium hover:underline"
                    onClick={() => onVehicleClick(vehicle)}
                  >
                    View details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {depotMarkers.map(({ vehicle, position, icon }) => (
          <Marker
            key={vehicle.ambulanceId}
            position={position}
            icon={icon}
            zIndexOffset={500}
            eventHandlers={{
              click: () => onVehicleClick?.(vehicle),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Ambulance {vehicle.vehicle_number}</p>
                <p className="text-text-secondary">{vehicle.status}</p>
                {onVehicleClick && (
                  <button
                    type="button"
                    className="mt-2 text-primary font-medium hover:underline"
                    onClick={() => onVehicleClick(vehicle)}
                  >
                    View details
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </BaseMap>
    </div>
  );
}
