/**
 * Ambulance Dashboard – driver UI. Aligns with spec: Vehicle + status, Accept/Reject,
 * status flow (En Route → Arrived → Patient Picked → Complete with trip notes), Trip History.
 */
import { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Select, Modal } from '../../components/common';
import {
  useAmbulanceDashboard,
  useUpdateAmbulanceStatus,
  useAcceptTrip,
  useRejectTrip,
  useStartTrip,
  useArrivedTrip,
  usePatientPickedTrip,
  useCompleteTrip,
} from '../../hooks/useAmbulanceApi';
import { Check, Clock, MapPin, Building2, FileText } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'On Duty', label: 'On Duty' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Offline', label: 'Offline' },
];

function formatTimeAgo(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  const now = new Date();
  const mins = Math.max(0, Math.floor((now - d) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return `${h} hr ago`;
}

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

function StatCard({ icon: Icon, label, value, iconBg }) {
  return (
    <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4" hover={false}>
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card text-white"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className="text-xl font-bold text-text-primary">{value}</p>
      </div>
    </Card>
  );
}

const STATUS_LABELS = {
  pending: 'Pending',
  assigned: 'Accepted',
  en_route: 'En Route',
  arrived: 'Arrived',
  patient_picked: 'Patient Picked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function AmbulanceDashboard() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [locationInput, setLocationInput] = useState('');
  const [completeModal, setCompleteModal] = useState(null);
  const [tripNotes, setTripNotes] = useState('');

  const { data, isLoading, isError, error, refetch } = useAmbulanceDashboard();
  const updateStatus = useUpdateAmbulanceStatus();
  const acceptTrip = useAcceptTrip();
  const rejectTrip = useRejectTrip();
  const startTrip = useStartTrip();
  const arrivedTrip = useArrivedTrip();
  const patientPickedTrip = usePatientPickedTrip();
  const completeTrip = useCompleteTrip();

  const ambulance = data?.ambulance || null;
  const stats = data?.stats ?? {};
  const tripsToday = stats.tripsToday ?? 0;
  const avgResponseMins = stats.avgResponseMins ?? 0;
  const distanceKm = stats.distanceKm ?? 0;
  const displayStatus = ambulance?.status || stats.status || 'Available';
  const tripRequests = data?.tripRequests || [];
  const tripHistory = data?.tripHistory || [];

  useEffect(() => {
    if (ambulance?.current_location) setLocationInput(ambulance.current_location);
  }, [ambulance?.current_location]);

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show]);

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });
  const onError = (err) => showToast(err.message || 'Failed', 'error');

  const handleStatusChange = (value) => {
    updateStatus.mutate({ status: value }, { onSuccess: () => showToast('Status updated'), onError });
  };

  const handleLocationBlur = () => {
    const loc = locationInput.trim();
    if (loc && loc !== ambulance?.current_location) {
      updateStatus.mutate({ current_location: loc }, { onSuccess: () => showToast('Location updated'), onError });
    }
  };

  const handleAccept = (id) => {
    acceptTrip.mutate(id, { onSuccess: () => showToast('Trip accepted'), onError });
  };

  const handleReject = (id) => {
    rejectTrip.mutate(id, { onSuccess: () => showToast('Trip rejected'), onError });
  };

  const handleStart = (id) => {
    startTrip.mutate(id, { onSuccess: () => showToast('Trip started'), onError });
  };

  const handleArrived = (id) => {
    arrivedTrip.mutate(id, { onSuccess: () => showToast('Marked arrived'), onError });
  };

  const handlePatientPicked = (id) => {
    patientPickedTrip.mutate(id, { onSuccess: () => showToast('Patient picked up'), onError });
  };

  const openCompleteModal = (req) => {
    setCompleteModal(req);
    setTripNotes('');
  };

  const handleCompleteSubmit = () => {
    if (!completeModal) return;
    completeTrip.mutate(
      { id: completeModal.id, trip_notes: tripNotes.trim() || undefined },
      {
        onSuccess: () => {
          showToast('Trip completed');
          setCompleteModal(null);
        },
        onError,
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-error">{error?.message || 'Failed to load dashboard'}</p>
        <Button variant="primary" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Status */}
      <Card className="space-y-4" hover={false}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-text-primary">Vehicle Status</h2>
          {!ambulance && (
            <p className="text-sm text-warning">No ambulance assigned. Contact admin to get a vehicle assigned.</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Current Status</label>
            <Select
              options={[{ value: '', label: 'Select status' }, ...STATUS_OPTIONS]}
              value={displayStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={!ambulance}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Current Location</label>
            <Input
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onBlur={handleLocationBlur}
              placeholder="e.g. Main Hospital Entrance"
              disabled={!ambulance}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Vehicle Number</label>
            <Input value={ambulance?.vehicle_number ?? '–'} readOnly disabled className="bg-surface-muted" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Check} label="Trips Today" value={tripsToday} iconBg="var(--color-icon-green)" />
          <StatCard icon={Clock} label="Avg Response Time" value={avgResponseMins ? `${avgResponseMins}m` : '–'} iconBg="var(--color-icon-blue)" />
          <StatCard icon={MapPin} label="Distance Covered" value={distanceKm ? `${distanceKm} km` : '–'} iconBg="var(--color-icon-purple)" />
          <StatCard icon={Check} label="Status" value={displayStatus} iconBg="var(--color-icon-teal)" />
        </div>
      </Card>

      {/* ICU / Hospital delivery info */}
      <Card hover={false} className="border-l-4 border-primary">
        <p className="text-sm text-text-secondary">
          <strong className="text-text-primary">ICU / Hospital deliveries:</strong> Use <strong>Mark Arrived</strong> when you reach the facility. Use <strong>Complete Trip</strong> to mark patient delivered and add your emergency report in the trip notes.
        </p>
      </Card>

      {/* Active Trip Requests */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-text-primary">Trip Requests</h2>
        {tripRequests.length === 0 ? (
          <Card hover={false}>
            <p className="text-text-muted">No active trip requests. Completed trips are in Trip History below.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {tripRequests.map((req) => {
              const isPending = req.status === 'pending';
              const isAssigned = req.status === 'assigned';
              const isEnRoute = req.status === 'en_route';
              const isArrived = req.status === 'arrived';
              const isPatientPicked = req.status === 'patient_picked';
              const isMine = req._source === 'assigned';
              const title = req.patient?.full_name || 'Emergency Call';
              const priorityVariant = req.priority === 'High' ? 'error' : req.priority === 'Medium' ? 'warning' : 'default';

              return (
                <Card key={req.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" hover={false}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-text-primary">{title}</p>
                      <Badge variant={priorityVariant}>
                        {req.priority === 'High' ? 'High Priority' : req.priority === 'Medium' ? 'Medium Priority' : 'Low Priority'}
                      </Badge>
                      <Badge variant={isPending ? 'warning' : 'primary'}>{STATUS_LABELS[req.status] || req.status}</Badge>
                      {req.notes && req.notes.includes('ICU') && (
                        <Badge variant="default">ICU Transfer</Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-text-secondary">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-error" />
                        From: {req.from_address}
                      </p>
                      <p className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-text-muted" />
                        To: {req.to_address}
                      </p>
                      <p className="flex items-center gap-2 text-text-muted">
                        <Clock className="h-4 w-4 shrink-0" />
                        {formatTimeAgo(req.requested_at)}
                      </p>
                      {req.notes && (
                        <p className="flex items-center gap-2 text-text-secondary mt-1">
                          <FileText className="h-4 w-4 shrink-0" />
                          {req.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-end justify-end gap-2">
                    {isPending && (
                      <>
                        <Button variant="primary" onClick={() => handleAccept(req.id)} disabled={acceptTrip.isPending}>
                          Accept Trip
                        </Button>
                      </>
                    )}
                    {isAssigned && isMine && (
                      <>
                        <Button variant="secondary" className="!bg-primary !text-white hover:!bg-primary-dark" onClick={() => handleStart(req.id)} disabled={startTrip.isPending}>
                          Start Trip
                        </Button>
                        <Button variant="outline" onClick={() => handleReject(req.id)} disabled={rejectTrip.isPending}>
                          Reject
                        </Button>
                      </>
                    )}
                    {isEnRoute && isMine && (
                      <>
                        <Button variant="primary" onClick={() => handleArrived(req.id)} disabled={arrivedTrip.isPending}>
                          Mark Arrived
                        </Button>
                        <Button variant="outline" onClick={() => handleReject(req.id)} disabled={rejectTrip.isPending}>
                          Reject
                        </Button>
                      </>
                    )}
                    {isArrived && isMine && (
                      <>
                        <Button variant="primary" onClick={() => handlePatientPicked(req.id)} disabled={patientPickedTrip.isPending}>
                          Patient Picked
                        </Button>
                        <Button variant="outline" onClick={() => handleReject(req.id)} disabled={rejectTrip.isPending}>
                          Reject
                        </Button>
                      </>
                    )}
                    {isPatientPicked && isMine && (
                      <>
                        <Button variant="primary" onClick={() => openCompleteModal(req)} disabled={completeTrip.isPending}>
                          Complete Trip
                        </Button>
                        <Button variant="outline" onClick={() => handleReject(req.id)} disabled={rejectTrip.isPending}>
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Trip History */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-text-primary">Trip History</h2>
        {tripHistory.length === 0 ? (
          <Card hover={false}>
            <p className="text-text-muted">No completed trips yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tripHistory.map((req) => (
              <Card key={req.id} hover={false} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-text-primary">{req.patient?.full_name || 'Patient'}</p>
                  <p className="text-sm text-text-secondary">{req.from_address} → {req.to_address}</p>
                  <p className="text-xs text-text-muted">{formatDate(req.completed_at)} · {req.priority} priority</p>
                  {req.trip_notes && <p className="text-sm text-text-secondary mt-1">{req.trip_notes}</p>}
                </div>
                <Badge variant="success">Completed</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Complete Trip modal */}
      <Modal open={!!completeModal} onClose={() => setCompleteModal(null)} title="Complete Trip">
        {completeModal && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {completeModal.from_address} → {completeModal.to_address}
            </p>
            <Input
              label="Trip notes (optional)"
              value={tripNotes}
              onChange={(e) => setTripNotes(e.target.value)}
              placeholder="e.g. Patient stable, handed to ER"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCompleteModal(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleCompleteSubmit} disabled={completeTrip.isPending}>
                {completeTrip.isPending ? 'Completing…' : 'Complete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {toast.show && (
        <div
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-card px-4 py-3 text-sm font-medium text-white shadow-lg"
          style={{ backgroundColor: toast.type === 'error' ? 'var(--color-error)' : 'var(--color-success)' }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
