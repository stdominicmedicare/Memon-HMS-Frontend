/**
 * Ambulance Dashboard – driver UI. Vehicle status, Accept/Reject, trip status flow,
 * GPS tracking (Start Trip → broadcast every 5s), map, and Complete.
 */
import { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Select, Modal } from '../../components/common';
import {
  useAmbulanceDashboard,
  useUpdateAmbulanceStatus,
  useAcceptTrip,
  useRejectTrip,
  useArrivedTrip,
  usePatientPickedTrip,
  useArrivedAtHospitalTrip,
  useCompleteTrip,
} from '../../hooks/useAmbulanceApi';
import { useAmbulanceTracking } from '../../features/ambulance/hooks/useAmbulanceTracking';
import { useNominatim } from '../../hooks/useNominatim';
import { useOSRM } from '../../hooks/useOSRM';
import { apiPost } from '../../services/api';
import AmbulanceTrackingMap from '../../features/ambulance/components/AmbulanceTrackingMap';
import DriverFleetMap from '../../features/ambulance/components/DriverFleetMap';
import TripStatusControls from '../../features/ambulance/components/TripStatusControls';
import { Check, Clock, MapPin, Building2, FileText, AlertCircle } from 'lucide-react';

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
  arrived_at_hospital: 'Arrived at Hospital',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function AmbulanceDashboard() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [locationInput, setLocationInput] = useState('');
  const [completeModal, setCompleteModal] = useState(null);
  const [tripNotes, setTripNotes] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const { data, isLoading, isError, error, refetch } = useAmbulanceDashboard();
  const updateStatus = useUpdateAmbulanceStatus();
  const acceptTrip = useAcceptTrip();
  const rejectTrip = useRejectTrip();
  const arrivedTrip = useArrivedTrip();
  const patientPickedTrip = usePatientPickedTrip();
  const arrivedAtHospitalTrip = useArrivedAtHospitalTrip();
  const completeTrip = useCompleteTrip();
  const tracking = useAmbulanceTracking();

  const ambulance = data?.ambulance || null;
  const stats = data?.stats ?? {};
  const tripsToday = stats.tripsToday ?? 0;
  const avgResponseMins = stats.avgResponseMins ?? 0;
  const distanceKm = stats.distanceKm ?? 0;
  const displayStatus = ambulance?.status || stats.status || 'Available';
  const tripRequests = data?.tripRequests || [];
  const tripHistory = data?.tripHistory || [];
  const activeTrip = tripRequests.find(
    (r) => r._source === 'assigned' && ['en_route', 'arrived', 'patient_picked', 'arrived_at_hospital'].includes(r.status)
  );
  const { lat: destLat, lng: destLng } = useNominatim(activeTrip?.to_address || null);
  const destination = destLat != null && destLng != null ? { lat: destLat, lng: destLng } : null;
  const driverPos = tracking.position ? { latitude: tracking.position.latitude, longitude: tracking.position.longitude, heading: tracking.position.heading ?? 0 } : null;
  const fromForRoute = driverPos ? { lat: driverPos.latitude, lng: driverPos.longitude } : null;
  const { route: routePath } = useOSRM(fromForRoute && destination ? { from: fromForRoute, to: destination } : null);

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

  const handleStartTrip = (id) => {
    tracking.start(id).then(() => showToast('Trip started – GPS broadcasting')).catch((e) => showToast(e?.message || 'Failed to start tracking', 'error'));
  };

  const handleArrived = (id) => {
    arrivedTrip.mutate(id, {
      onSuccess: () => {
        tracking.broadcastStatus('arrived');
        showToast('Marked arrived');
      },
      onError,
    });
  };

  const handlePatientPicked = (id) => {
    patientPickedTrip.mutate(id, {
      onSuccess: () => {
        tracking.broadcastStatus('patient_picked');
        showToast('Patient picked up');
      },
      onError,
    });
  };

  const handleArrivedAtHospital = (id) => {
    arrivedAtHospitalTrip.mutate(id, {
      onSuccess: () => {
        tracking.broadcastStatus('arrived_at_hospital');
        showToast('Arrived at hospital');
      },
      onError,
    });
  };

  const openCompleteModal = (req) => {
    setCompleteModal(req);
    setTripNotes('');
  };

  const handleCompleteSubmit = async () => {
    if (!completeModal) return;
    setIsCompleting(true);
    try {
      await apiPost('/api/tracking/stop', {
        trip_id: completeModal.id,
        trip_notes: tripNotes.trim() || undefined,
      });
      tracking.broadcastStatus('completed');
      tracking.stop();
      showToast('Trip completed');
      setCompleteModal(null);
    } catch (e) {
      showToast(e?.message || 'Failed to complete trip', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  function getGpsErrorMessage(err) {
    if (!err) return null;
    const msg = err.message || err;
    if (msg.includes('Permission denied') || msg.includes('permission')) {
      return 'Location access denied. Enable location in your browser or device settings to broadcast GPS.';
    }
    if (msg.includes('unavailable') || msg.includes('Position unavailable')) {
      return 'GPS signal unavailable. Move to an area with better signal or wait for reconnection.';
    }
    if (msg.includes('Timeout')) {
      return 'Location request timed out. Retry or check your GPS.';
    }
    if (msg.includes('not supported')) {
      return 'Geolocation is not supported in this browser.';
    }
    return msg;
  }

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

  const assignedWaiting = tripRequests.filter((r) => r._source === 'assigned' && r.status === 'assigned');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const completedToday = tripHistory.filter((r) => r.completed_at && new Date(r.completed_at) >= todayStart);

  return (
    <div className="space-y-6">
      {/* Live Fleet Map - always visible */}
      <section>
        <h2 className="mb-2 text-lg font-bold text-text-primary">Fleet Map</h2>
        <DriverFleetMap />
      </section>

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

      {/* Trip Management Panel */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-text-primary">Trip Management</h2>

        {/* Active Trip */}
        {activeTrip && (
          <div className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-text-primary">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> ACTIVE TRIP
            </h3>
            <Card hover={false} className="space-y-3 border-l-4 border-red-500">
              <p className="font-bold text-text-primary">Patient: {activeTrip.patient?.full_name || 'Emergency Call'}</p>
              <p className="text-sm text-text-secondary">From: {activeTrip.from_address}</p>
              <p className="text-sm text-text-secondary">To: {activeTrip.to_address}</p>
              <p className="text-sm">
                <Badge variant="primary">{STATUS_LABELS[activeTrip.status] || activeTrip.status}</Badge>
              </p>
              {tracking.error && (
                <div className="flex gap-2 rounded-lg bg-error/10 p-3 text-sm text-error">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">GPS issue</p>
                    <p>{getGpsErrorMessage(tracking.error)}</p>
                    <p className="mt-1 text-text-muted">Location will resume when signal is available. You can still update trip status.</p>
                  </div>
                </div>
              )}
              <AmbulanceTrackingMap
                driverPosition={driverPos}
                destination={destination}
                routePath={routePath}
                className="h-[280px] w-full rounded-lg overflow-hidden border border-border"
              />
              <TripStatusControls
                request={activeTrip}
                isMine
                isBroadcasting={tracking.isBroadcasting}
                isStarting={tracking.isStarting}
                onStartTrip={handleStartTrip}
                onArrived={handleArrived}
                onPatientPicked={handlePatientPicked}
                onArrivedAtHospital={handleArrivedAtHospital}
                onComplete={openCompleteModal}
                onReject={handleReject}
                loading={
                  tracking.isStarting ||
                  arrivedTrip.isPending || patientPickedTrip.isPending || arrivedAtHospitalTrip.isPending || completeTrip.isPending
                }
              />
            </Card>
          </div>
        )}

        {/* Assigned - Waiting to start */}
        {assignedWaiting.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-text-primary">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> ASSIGNED – Waiting
            </h3>
            <div className="space-y-3">
              {assignedWaiting.map((req) => {
                const loading = tracking.isStarting || acceptTrip.isPending || rejectTrip.isPending;
                return (
                  <Card key={req.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" hover={false}>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-text-primary">Patient: {req.patient?.full_name || 'Emergency Call'}</p>
                      <p className="text-sm text-text-secondary">Pickup: {req.from_address}</p>
                      <p className="text-sm text-text-muted">Priority: {req.priority}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <TripStatusControls
                        request={req}
                        isMine
                        isBroadcasting={tracking.isBroadcasting}
                        isStarting={tracking.isStarting}
                        onStartTrip={handleStartTrip}
                        onReject={handleReject}
                        loading={loading}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending requests (available to accept) */}
        {tripRequests.filter((r) => r.status === 'pending').length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-base font-semibold text-text-primary">New Requests</h3>
            <div className="space-y-4">
            {tripRequests.filter((r) => r.status === 'pending').map((req) => {
              const isPending = req.status === 'pending';
              const isMine = req._source === 'assigned';
              const title = req.patient?.full_name || 'Emergency Call';
              const priorityVariant = req.priority === 'High' ? 'error' : req.priority === 'Medium' ? 'warning' : 'default';
              const loading =
                tracking.isStarting ||
                acceptTrip.isPending || rejectTrip.isPending || arrivedTrip.isPending ||
                patientPickedTrip.isPending || arrivedAtHospitalTrip.isPending || completeTrip.isPending;

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
                      <Button variant="primary" onClick={() => handleAccept(req.id)} disabled={acceptTrip.isPending}>
                        Accept Trip
                      </Button>
                    )}
                    <TripStatusControls
                      request={req}
                      isMine={isMine}
                      isBroadcasting={tracking.isBroadcasting}
                      isStarting={tracking.isStarting}
                      onStartTrip={handleStartTrip}
                      onArrived={handleArrived}
                      onPatientPicked={handlePatientPicked}
                      onArrivedAtHospital={handleArrivedAtHospital}
                      onComplete={openCompleteModal}
                      onReject={handleReject}
                      loading={loading}
                    />
                  </div>
                </Card>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {/* Completed Today */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-text-primary">Completed Today</h2>
        {completedToday.length === 0 ? (
          <Card hover={false}>
            <p className="text-text-muted">No completed trips today yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {completedToday.map((req) => {
              const durationMins = req.completed_at && req.requested_at
                ? Math.round((new Date(req.completed_at) - new Date(req.requested_at)) / 60000)
                : null;
              const completedTime = req.completed_at ? new Date(req.completed_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }) : '–';
              return (
                <Card key={req.id} hover={false} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{req.patient?.full_name || 'Patient'}</p>
                    <p className="text-sm text-text-secondary">{req.from_address} → {req.to_address}</p>
                    <p className="text-xs text-text-muted">
                      {completedTime}{durationMins != null ? ` · Duration: ${durationMins} min` : ''}
                    </p>
                    {req.trip_notes && <p className="text-sm text-text-secondary mt-1">{req.trip_notes}</p>}
                  </div>
                  <Badge variant="success">Completed</Badge>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* All Trip History (optional - older completions) */}
      {tripHistory.length > completedToday.length && (
        <div>
          <h2 className="mb-4 text-lg font-bold text-text-primary">Trip History</h2>
          <div className="space-y-3">
            {tripHistory.filter((r) => !r.completed_at || new Date(r.completed_at) < todayStart).map((req) => (
              <Card key={req.id} hover={false} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-text-primary">{req.patient?.full_name || 'Patient'}</p>
                  <p className="text-sm text-text-secondary">{req.from_address} → {req.to_address}</p>
                  <p className="text-xs text-text-muted">{formatDate(req.completed_at)} · {req.priority} priority</p>
                </div>
                <Badge variant="success">Completed</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

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
              <Button variant="primary" onClick={handleCompleteSubmit} disabled={isCompleting}>
                {isCompleting ? 'Completing…' : 'Complete'}
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
