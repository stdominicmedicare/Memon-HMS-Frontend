/**
 * Color-coded trip status badge. Auto-updates when tripStatus prop changes (from Realtime).
 */
import { Badge } from '../../../components/common';

const STATUS_CONFIG = {
  pending: { label: 'Pending', variant: 'warning' },
  assigned: { label: 'Assigned', variant: 'default' },
  en_route: { label: 'On the way', variant: 'primary' },
  arrived: { label: 'Arrived', variant: 'success' },
  patient_picked: { label: 'Patient picked up', variant: 'success' },
  arrived_at_hospital: { label: 'At hospital', variant: 'success' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

export default function TripStatusBadge({ tripStatus }) {
  const status = tripStatus ?? 'pending';
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'default' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
