/**
 * Driver and ambulance info for patient: name, vehicle number, call button.
 */
import { Card } from '../../../components/common';
import { User, Ambulance, Phone } from 'lucide-react';

export default function DriverInfoCard({ driver, ambulance }) {
  const name = driver?.full_name ?? 'Driver';
  const phone = driver?.phone ?? null;
  const vehicleNumber = ambulance?.vehicle_number ?? '–';

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" hover={false}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <User className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-text-primary">{name}</p>
          <p className="flex items-center gap-1.5 text-sm text-text-secondary">
            <Ambulance className="h-4 w-4" />
            Ambulance {vehicleNumber}
          </p>
        </div>
      </div>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-2 rounded-lg bg-success/15 px-4 py-2 text-sm font-medium text-success hover:bg-success/25"
        >
          <Phone className="h-4 w-4" />
          Call driver
        </a>
      )}
    </Card>
  );
}
