/**
 * Trip status buttons: Start Trip, Arrived at Patient, Patient Picked, Arrived at Hospital, Complete.
 * Start Trip → begins GPS broadcasting; Complete → stops it.
 */
import { Button } from '../../../components/common';

const STATUS_LABELS = {
  pending: 'Pending',
  assigned: 'Accepted',
  en_route: 'En Route',
  arrived: 'Arrived',
  patient_picked: 'Patient Picked',
  arrived_at_hospital: 'Arrived at Hospital',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function TripStatusControls({
  request,
  isMine,
  isBroadcasting,
  isStarting,
  onStartTrip,
  onArrived,
  onPatientPicked,
  onArrivedAtHospital,
  onComplete,
  onReject,
  loading,
}) {
  const status = request?.status;
  const id = request?.id;

  const isAssigned = status === 'assigned';
  const isEnRoute = status === 'en_route';
  const isArrived = status === 'arrived';
  const isPatientPicked = status === 'patient_picked';
  const isArrivedAtHospital = status === 'arrived_at_hospital';

  if (!isMine) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAssigned && (
        <>
          <Button
            variant="primary"
            className="!bg-primary !text-white hover:!bg-primary-dark"
            onClick={() => onStartTrip(id)}
            disabled={loading}
          >
            {isStarting ? 'Starting…' : `Start Trip${isBroadcasting ? ' (GPS on)' : ''}`}
          </Button>
          <Button variant="outline" onClick={() => onReject(id)} disabled={loading}>
            Reject
          </Button>
        </>
      )}
      {isEnRoute && (
        <>
          <Button variant="primary" onClick={() => onArrived(id)} disabled={loading}>
            Arrived at Patient
          </Button>
          <Button variant="outline" onClick={() => onReject(id)} disabled={loading}>
            Reject
          </Button>
        </>
      )}
      {isArrived && (
        <>
          <Button variant="primary" onClick={() => onPatientPicked(id)} disabled={loading}>
            Patient Picked
          </Button>
          <Button variant="outline" onClick={() => onReject(id)} disabled={loading}>
            Reject
          </Button>
        </>
      )}
      {isPatientPicked && (
        <>
          <Button variant="primary" onClick={() => onArrivedAtHospital(id)} disabled={loading}>
            Arrived at Hospital
          </Button>
          <Button variant="outline" onClick={() => onReject(id)} disabled={loading}>
            Reject
          </Button>
        </>
      )}
      {isArrivedAtHospital && (
        <>
          <Button variant="primary" onClick={() => onComplete(request)} disabled={loading}>
            Complete Trip
          </Button>
          <Button variant="outline" onClick={() => onReject(id)} disabled={loading}>
            Reject
          </Button>
        </>
      )}
    </div>
  );
}

export { STATUS_LABELS };
