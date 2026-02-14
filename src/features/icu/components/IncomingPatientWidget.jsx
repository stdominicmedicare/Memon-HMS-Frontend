/**
 * Compact card for one incoming patient: mini map, ETA, patient/doctor info, 5-min alert, Prepare Bed.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card } from '../../../components/common';
import { BaseMap, AmbulanceMarker, ETADisplay } from '../../../components/map';
import { useNominatim } from '../../../hooks/useNominatim';
import { useOSRM } from '../../../hooks/useOSRM';
import { User, Stethoscope, AlertCircle } from 'lucide-react';

const STATUS_LABELS = {
  en_route: 'En route',
  arrived: 'Arrived',
  patient_picked: 'Patient picked up',
  arrived_at_hospital: 'At hospital',
};

const destinationIcon = L.divIcon({
  className: 'destination-marker-mini',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#dc2626;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,0.3)"></div>',
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center?.length >= 2) map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

export default function IncomingPatientWidget({
  trip,
  ambulanceLocation,
  tripStatus,
  availableBeds = [],
  onPrepareBed,
  onArrivingSoon,
  className = '',
}) {
  const notifiedArrivingSoon = useRef(false);
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
  const etaMinutes = durationSeconds != null ? Math.ceil(durationSeconds / 60) : null;
  const isArrivingSoon = etaMinutes != null && etaMinutes <= 5 && etaMinutes >= 0;

  useEffect(() => {
    if (isArrivingSoon && onArrivingSoon && trip?.id && !notifiedArrivingSoon.current) {
      notifiedArrivingSoon.current = true;
      onArrivingSoon(trip.id, trip.patient?.full_name ?? 'Patient');
    }
  }, [isArrivingSoon, onArrivingSoon, trip?.id, trip?.patient?.full_name]);

  const mapCenter = useMemo(() => {
    if (ambulancePoint) return [ambulancePoint.lat, ambulancePoint.lng];
    if (destinationPoint) return [destinationPoint.lat, destinationPoint.lng];
    return [40.7128, -74.006];
  }, [ambulancePoint, destinationPoint]);

  const patientName = trip?.patient?.full_name ?? 'Patient';
  const doctorName = trip?.doctor?.full_name ?? '–';
  const condition = trip?.icu_request?.request_notes || trip?.icu_request?.priority_level || '–';
  const statusLabel = STATUS_LABELS[tripStatus] ?? tripStatus ?? '–';

  return (
    <Card className={`overflow-hidden ${className}`} hover={false}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-text-primary flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              {patientName}
            </h3>
            <span className="text-xs font-medium text-text-muted uppercase tracking-wide">{statusLabel}</span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
            <Stethoscope className="h-3.5 w-3.5" />
            Dr. {doctorName}
          </p>
          {condition && (
            <p className="mt-0.5 text-sm text-text-muted">Condition / notes: {condition}</p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <ETADisplay
              durationSeconds={durationSeconds}
              label="ETA"
              className="text-sm"
            />
          </div>
          {isArrivingSoon && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Prepare bed – patient arriving soon!
              </span>
              {availableBeds.length > 0 && (
                <div className="flex flex-wrap gap-2 w-full mt-1">
                  {availableBeds.slice(0, 5).map((bed) => (
                    <button
                      key={bed.id}
                      type="button"
                      onClick={() => onPrepareBed?.(bed.id)}
                      className="rounded-md bg-amber-100 dark:bg-amber-800/50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-700/50"
                    >
                      Prepare {bed.bed_number}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="w-full sm:w-48 h-36 shrink-0 rounded-lg overflow-hidden border border-border bg-surface-muted relative">
          <BaseMap center={mapCenter} zoom={13} className="h-full w-full min-h-0">
            <ChangeView center={mapCenter} zoom={13} />
            {ambulancePoint && (
              <AmbulanceMarker position={[ambulancePoint.lat, ambulancePoint.lng]} />
            )}
            {destinationPoint && (
              <Marker position={[destinationPoint.lat, destinationPoint.lng]} icon={destinationIcon} zIndexOffset={100} />
            )}
          </BaseMap>
        </div>
      </div>
    </Card>
  );
}
