/**
 * Modal showing trip details when admin clicks an ambulance on the fleet map.
 * Patient info, status, ETA, route visualization.
 */
import { useMemo } from 'react';
import { Modal } from '../../../components/common';
import { useNominatim } from '../../../hooks/useNominatim';
import { useOSRM } from '../../../hooks/useOSRM';
import { ETADisplay } from '../../../components/map';
import { User, MapPin, Stethoscope, Ambulance } from 'lucide-react';

const STATUS_LABELS = {
  en_route: 'En route',
  arrived: 'Arrived at patient',
  patient_picked: 'Patient picked up',
  arrived_at_hospital: 'Arrived at hospital',
};

function formatTimeAgo(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  const now = new Date();
  const mins = Math.max(0, Math.floor((now - d) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} hr ago`;
  const day = Math.floor(h / 24);
  return `${day} day${day !== 1 ? 's' : ''} ago`;
}

export default function FleetTripDetailModal({ open, onClose, vehicle }) {
  const trip = vehicle?.trip;
  const toAddress = trip?.to_address ?? '';
  const { lat: toLat, lng: toLng } = useNominatim(toAddress);
  const ambulancePoint = vehicle?.location ? { lat: vehicle.location.lat, lng: vehicle.location.lng } : null;
  const destinationPoint = useMemo(() => {
    if (toLat != null && toLng != null) return { lat: toLat, lng: toLng };
    return null;
  }, [toLat, toLng]);

  const { durationSeconds, route } = useOSRM(
    ambulancePoint && destinationPoint ? { from: ambulancePoint, to: destinationPoint } : null
  );

  if (!vehicle) return null;

  const patientName = trip?.patient?.full_name ?? '–';
  const driverName = trip?.driver?.full_name ?? '–';
  const statusLabel = STATUS_LABELS[vehicle.tripStatus] ?? vehicle.tripStatus ?? '–';

  return (
    <Modal open={open} onClose={onClose} title={`Ambulance ${vehicle.vehicle_number}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
            {vehicle.status}
          </span>
          {vehicle.tripStatus && (
            <span className="rounded-full bg-surface-muted px-3 py-1 text-sm text-text-secondary">
              {statusLabel}
            </span>
          )}
        </div>

        {trip && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-lg border border-border p-3">
                <User className="h-5 w-5 shrink-0 text-text-muted" />
                <div>
                  <p className="text-xs font-medium uppercase text-text-muted">Patient</p>
                  <p className="font-medium text-text-primary">{patientName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-border p-3">
                <Stethoscope className="h-5 w-5 shrink-0 text-text-muted" />
                <div>
                  <p className="text-xs font-medium uppercase text-text-muted">Driver</p>
                  <p className="font-medium text-text-primary">{driverName}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>From: {trip.from_address || '–'}</span>
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>To: {trip.to_address || '–'}</span>
              </p>
            </div>

            {durationSeconds != null && (
              <div className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2">
                <ETADisplay durationSeconds={durationSeconds} label="ETA to destination:" className="text-sm font-medium" />
              </div>
            )}

            {route?.length > 0 && (
              <p className="text-xs text-text-muted">
                Route: {route.length} points (visualization on main map)
              </p>
            )}
          </>
        )}

        {!trip && (
          <div className="space-y-3">
            {vehicle.driver && (
              <div className="flex items-start gap-2 rounded-lg border border-border p-3">
                <Stethoscope className="h-5 w-5 shrink-0 text-text-muted" />
                <div>
                  <p className="text-xs font-medium uppercase text-text-muted">Driver</p>
                  <p className="font-medium text-text-primary">{vehicle.driver.full_name}</p>
                  {vehicle.driver.phone && (
                    <p className="text-sm text-text-secondary">{vehicle.driver.phone}</p>
                  )}
                </div>
              </div>
            )}
            {vehicle.status === 'Available' && (
              <>
                {vehicle.last_completed_at && (
                  <p className="text-sm text-text-secondary">
                    Last trip completed: {formatTimeAgo(vehicle.last_completed_at)}
                  </p>
                )}
                <p className="rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
                  Ready for assignment
                </p>
              </>
            )}
            {vehicle.status === 'Returning' && (
              <p className="text-text-secondary">This ambulance is returning to base.</p>
            )}
            {(vehicle.status === 'Offline' || vehicle.status === 'Maintenance') && (
              <p className="text-text-secondary">
                {vehicle.status === 'Offline'
                  ? 'This ambulance is offline (driver has not started shift).'
                  : 'This ambulance is in maintenance.'}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
