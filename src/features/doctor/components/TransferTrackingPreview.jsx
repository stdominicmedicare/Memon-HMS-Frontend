/**
 * Compact transfer tracking card: progress timeline, status, ETA. No full map.
 */
import { useMemo } from 'react';
import { Card } from '../../../components/common';
import { ETADisplay } from '../../../components/map';
import { useNominatim } from '../../../hooks/useNominatim';
import { useOSRM } from '../../../hooks/useOSRM';
import { User, MapPin, Clock } from 'lucide-react';

const STEPS = [
  { key: 'en_route', label: 'En route' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'patient_picked', label: 'Patient picked up' },
  { key: 'arrived_at_hospital', label: 'At hospital' },
  { key: 'completed', label: 'Completed' },
];

export default function TransferTrackingPreview({
  trip,
  ambulanceLocation,
  tripStatus,
  className = '',
}) {
  const toAddress = trip?.to_address ?? '';
  const { lat: toLat, lng: toLng } = useNominatim(toAddress);
  const ambulancePoint = useMemo(() => {
    if (ambulanceLocation?.lat != null && ambulanceLocation?.lng != null) {
      return { lat: ambulanceLocation.lat, lng: ambulanceLocation.lng };
    }
    return null;
  }, [ambulanceLocation?.lat, ambulanceLocation?.lng]);
  const destinationPoint = useMemo(() => {
    if (toLat != null && toLng != null) return { lat: toLat, lng: toLng };
    return null;
  }, [toLat, toLng]);

  const { durationSeconds } = useOSRM(
    ambulancePoint && destinationPoint ? { from: ambulancePoint, to: destinationPoint } : null
  );

  const currentIndex = STEPS.findIndex((s) => s.key === tripStatus);
  const patientName = trip?.patient?.full_name ?? 'Patient';

  return (
    <Card className={`overflow-hidden ${className}`} hover={false}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {patientName}
          </h3>
          <ETADisplay durationSeconds={durationSeconds} label="" className="text-sm font-medium" />
        </div>
        {trip?.to_address && (
          <p className="flex items-center gap-1.5 text-sm text-text-secondary">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{trip.to_address}</span>
          </p>
        )}
        {/* Progress timeline */}
        <div className="flex items-center gap-1">
          {STEPS.filter((s) => s.key !== 'completed').map((step, i) => {
            const isDone = currentIndex > i;
            const isCurrent = currentIndex === i;
            return (
              <div key={step.key} className="flex flex-1 items-center">
                <div
                  className={`h-2 flex-1 rounded-full ${
                    isDone ? 'bg-primary' : isCurrent ? 'bg-primary/60' : 'bg-border'
                  }`}
                  title={step.label}
                />
                {i < STEPS.length - 2 && <div className="w-0.5 h-2 bg-transparent" />}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-text-muted">
          <span>En route</span>
          <span>At hospital</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-text-muted shrink-0" />
          <span className="text-text-secondary">
            {STEPS.find((s) => s.key === tripStatus)?.label ?? tripStatus ?? '–'}
          </span>
        </div>
      </div>
    </Card>
  );
}
