/**
 * Patient Dashboard – Phase 2. Summary cards, tabs (Appointments, Records, Prescriptions, Ambulance).
 * Design: Patient Portal with stats, My Appointments, Book appointment, empty states, ambulance stub.
 */
import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Select,
} from '../../components/common';
import {
  usePatientStats,
  usePatientAppointments,
  usePatientRecords,
  usePatientPrescriptions,
  usePatientDoctors,
  useBookAppointment,
  usePatientAmbulanceRequests,
  useCreateAmbulanceRequest,
  useCancelAmbulanceRequest,
  usePatientIcuStatus,
  usePatientIcuMonitoringReport,
  usePatientTransfusionHistory,
} from '../../hooks/usePatientApi';
import { usePatientTracking } from '../../features/patient/hooks/usePatientTracking';
import PatientAmbulanceMap from '../../features/patient/components/PatientAmbulanceMap';
import {
  CalendarCheck,
  FileText,
  Pill,
  Heart,
  User as UserIcon,
  Ambulance,
  Building2,
  Eye,
  Download,
  Droplets,
  MapPin,
} from 'lucide-react';
const TAB_APPOINTMENTS = 'appointments';
const TAB_RECORDS = 'records';
const TAB_PRESCRIPTIONS = 'prescriptions';
const TAB_AMBULANCE = 'ambulance';
const TAB_ICU = 'icu';
const TAB_TRANSFUSION = 'transfusion';

function formatDate(iso) {
  if (!iso) return '–';
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatTime(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function SummaryCard({ icon: Icon, label, value, iconBg }) {
  return (
    <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
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

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState(TAB_APPOINTMENTS);
  const [bookOpen, setBookOpen] = useState(false);
  const [ambulanceOpen, setAmbulanceOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [bookForm, setBookForm] = useState({ doctor_id: '', scheduled_at: '', notes: '' });
  const [ambulanceForm, setAmbulanceForm] = useState({ from_address: '', to_address: '', priority: 'Medium' });

  const { data: stats, isLoading: statsLoading } = usePatientStats();
  const { data: appointments = [], isLoading: appointmentsLoading } = usePatientAppointments();
  const { data: records = [], isLoading: recordsLoading } = usePatientRecords();
  const { data: prescriptions = [], isLoading: prescriptionsLoading } = usePatientPrescriptions();
  const { data: doctors = [], isLoading: doctorsLoading } = usePatientDoctors();
  const { data: ambulanceRequests = [], isLoading: ambulanceRequestsLoading } = usePatientAmbulanceRequests();
  const { data: icuStatus, isLoading: icuStatusLoading } = usePatientIcuStatus();
  const { data: icuReport = [], isLoading: icuReportLoading } = usePatientIcuMonitoringReport();
  const { data: transfusionHistory = [], isLoading: transfusionLoading } = usePatientTransfusionHistory();
  const bookMutation = useBookAppointment();
  const createAmbulanceMutation = useCreateAmbulanceRequest();
  const cancelAmbulanceMutation = useCancelAmbulanceRequest();
  const [icuReportModal, setIcuReportModal] = useState(false);
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show]);

  const tabs = [
    { id: TAB_APPOINTMENTS, label: 'Appointments' },
    { id: TAB_RECORDS, label: 'Records' },
    { id: TAB_PRESCRIPTIONS, label: 'Prescriptions' },
    { id: TAB_AMBULANCE, label: 'Ambulance' },
    { id: TAB_ICU, label: 'ICU Status' },
    { id: TAB_TRANSFUSION, label: 'Transfusion History' },
  ];

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookForm.doctor_id || !bookForm.scheduled_at) {
      setToast({ show: true, message: 'Select doctor and date/time', type: 'error' });
      return;
    }
    try {
      await bookMutation.mutateAsync({
        doctor_id: bookForm.doctor_id,
        scheduled_at: new Date(bookForm.scheduled_at).toISOString(),
        notes: bookForm.notes || undefined,
      });
      setToast({ show: true, message: 'Appointment requested' });
      setBookOpen(false);
      setBookForm({ doctor_id: '', scheduled_at: '', notes: '' });
    } catch (err) {
      setToast({ show: true, message: err.message || 'Booking failed', type: 'error' });
    }
  };

  const handleAmbulanceSubmit = async (e) => {
    e.preventDefault();
    if (!ambulanceForm.from_address?.trim() || !ambulanceForm.to_address?.trim()) {
      setToast({ show: true, message: 'Enter pick-up and destination addresses', type: 'error' });
      return;
    }
    try {
      await createAmbulanceMutation.mutateAsync({
        from_address: ambulanceForm.from_address.trim(),
        to_address: ambulanceForm.to_address.trim(),
        priority: ambulanceForm.priority,
      });
      setToast({ show: true, message: 'Ambulance request submitted' });
      setAmbulanceOpen(false);
      setAmbulanceForm({ from_address: '', to_address: '', priority: 'Medium' });
    } catch (err) {
      setToast({ show: true, message: err.message || 'Request failed', type: 'error' });
    }
  };

  const handleCancelAmbulance = async (id) => {
    try {
      await cancelAmbulanceMutation.mutateAsync(id);
      setToast({ show: true, message: 'Request cancelled' });
    } catch (err) {
      setToast({ show: true, message: err.message || 'Cancel failed', type: 'error' });
    }
  };

  const s = stats || {};
  const upcomingCount = s.upcomingAppointments ?? 0;
  const recordsCount = s.medicalRecords ?? 0;
  const prescriptionsCount = s.activePrescriptions ?? 0;
  const healthScore = s.healthScore ?? 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={CalendarCheck}
          label="Upcoming Appointments"
          value={statsLoading ? '…' : upcomingCount}
          iconBg="var(--color-icon-blue)"
        />
        <SummaryCard
          icon={FileText}
          label="Medical Records"
          value={statsLoading ? '…' : recordsCount}
          iconBg="var(--color-icon-green)"
        />
        <SummaryCard
          icon={Pill}
          label="Active Prescriptions"
          value={statsLoading ? '…' : prescriptionsCount}
          iconBg="var(--color-icon-purple)"
        />
        <SummaryCard
          icon={Heart}
          label="Health Score"
          value={statsLoading ? '…' : `${healthScore}%`}
          iconBg="var(--color-error)"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4 overflow-x-auto" aria-label="Sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 py-3 text-sm font-medium transition-colors touch-manipulation ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === TAB_APPOINTMENTS && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-text-primary">My Appointments</h2>
            <Button variant="primary" onClick={() => setBookOpen(true)} className="w-full sm:w-auto">
              + Book Appointment
            </Button>
          </div>
          {appointmentsLoading ? (
            <Card><p className="text-text-muted">Loading…</p></Card>
          ) : appointments.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarCheck className="h-12 w-12 text-text-muted mb-2" />
                <p className="text-text-secondary">No appointments yet.</p>
                <Button variant="primary" className="mt-4" onClick={() => setBookOpen(true)}>
                  Book Appointment
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => {
                const doctor = apt.doctor || {};
                const status = apt.status;
                const isUpcoming = status === 'pending' || status === 'confirmed';
                return (
                  <Card key={apt.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                        <UserIcon className="h-5 w-5 text-text-muted" />
                      </span>
                      <div>
                        <p className="font-medium text-text-primary">{doctor.full_name || 'Doctor'}</p>
                        <p className="text-sm text-text-secondary">{doctor.specialty || 'General'}</p>
                        <p className="text-sm text-text-muted">
                          {formatDate(apt.scheduled_at)} · {formatTime(apt.scheduled_at)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isUpcoming ? 'primary' : 'success'} className="w-fit shrink-0">
                      {status === 'pending' ? 'Upcoming' : status === 'confirmed' ? 'Confirmed' : status}
                    </Badge>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === TAB_RECORDS && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Medical Records</h2>
          {recordsLoading ? (
            <Card><p className="text-text-muted">Loading…</p></Card>
          ) : records.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-14 w-14 text-text-muted mb-3" />
                <p className="text-text-secondary">Your medical records will appear here.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {records.map((rec) => (
                <Card key={rec.id}>
                  <p className="font-medium text-text-primary">{rec.diagnosis || 'No diagnosis'}</p>
                  {rec.notes && <p className="mt-1 text-sm text-text-secondary">{rec.notes}</p>}
                  <p className="mt-2 text-xs text-text-muted">
                    {rec.doctor?.full_name} · {formatDate(rec.created_at)}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === TAB_PRESCRIPTIONS && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Active Prescriptions</h2>
          {prescriptionsLoading ? (
            <Card><p className="text-text-muted">Loading…</p></Card>
          ) : prescriptions.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Pill className="h-14 w-14 text-text-muted mb-3" />
                <p className="text-text-secondary">Your prescriptions will appear here.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {prescriptions
                .filter((p) => ['active', 'pending', 'dispensed'].includes(p.status))
                .map((rx) => (
                  <Card key={rx.id}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-text-primary">{rx.medication}</p>
                        {rx.dosage && <p className="text-sm text-text-secondary">Dosage: {rx.dosage}</p>}
                        {rx.instructions && <p className="text-sm text-text-muted">{rx.instructions}</p>}
                        <p className="mt-2 text-xs text-text-muted">
                          {rx.doctor?.full_name} · {formatDate(rx.created_at)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          rx.status === 'dispensed'
                            ? 'bg-green-100 text-green-800'
                            : rx.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rx.status === 'dispensed' ? 'Dispensed' : rx.status === 'pending' ? 'Pending at pharmacy' : 'Active'}
                      </span>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === TAB_AMBULANCE && (
        <div className="space-y-4">
          <PatientAmbulanceMap onRequestAmbulance={() => setAmbulanceOpen(true)} />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-text-primary">Request Ambulance</h2>
            <Button variant="primary" onClick={() => setAmbulanceOpen(true)} className="w-full sm:w-auto">
              + Request Ambulance
            </Button>
          </div>
          <p className="text-sm text-text-secondary">Available 24/7 for medical emergencies. You can cancel before your request is accepted.</p>
          {ambulanceRequestsLoading ? (
            <Card><p className="text-text-muted">Loading…</p></Card>
          ) : ambulanceRequests.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Ambulance className="h-12 w-12 text-text-muted mb-2" />
                <p className="text-text-secondary">No ambulance requests yet.</p>
                <Button variant="primary" className="mt-4" onClick={() => setAmbulanceOpen(true)}>
                  Request Ambulance
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {ambulanceRequests.map((req) => (
                <Card key={req.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{req.from_address} → {req.to_address}</p>
                    <p className="text-sm text-text-muted">{formatDate(req.requested_at)} · {req.priority} priority</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={req.status === 'pending' ? 'warning' : req.status === 'cancelled' ? 'default' : 'success'}>
                      {req.status}
                    </Badge>
                    {req.status === 'pending' && (
                      <Button variant="outline" className="text-sm" onClick={() => handleCancelAmbulance(req.id)} disabled={cancelAmbulanceMutation.isPending}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
          <Modal open={ambulanceOpen} onClose={() => setAmbulanceOpen(false)} title="Request Ambulance">
            <form onSubmit={handleAmbulanceSubmit} className="space-y-4">
              <Input
                label="Pick-up address"
                value={ambulanceForm.from_address}
                onChange={(e) => setAmbulanceForm((f) => ({ ...f, from_address: e.target.value }))}
                placeholder="e.g. 123 Main St"
                required
              />
              <Input
                label="Destination (hospital / clinic)"
                value={ambulanceForm.to_address}
                onChange={(e) => setAmbulanceForm((f) => ({ ...f, to_address: e.target.value }))}
                placeholder="e.g. City Hospital"
                required
              />
              <Select
                label="Priority"
                options={[
                  { value: 'High', label: 'High (Emergency)' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]}
                value={ambulanceForm.priority}
                onChange={(e) => setAmbulanceForm((f) => ({ ...f, priority: e.target.value }))}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setAmbulanceOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={createAmbulanceMutation.isPending}>
                  {createAmbulanceMutation.isPending ? 'Submitting…' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {activeTab === TAB_ICU && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">ICU Status</h2>
          <Card className="border-l-4 border-primary">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-text-primary">Admission status</h3>
            </div>
            {icuStatusLoading ? (
              <p className="text-text-muted">Loading…</p>
            ) : !icuStatus?.request ? (
              <p className="text-text-secondary">No ICU admission request on file. Your doctor can request ICU transfer if needed.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-text-primary">
                  Status: <Badge variant={icuStatus.request.status === 'approved' ? 'success' : icuStatus.request.status === 'rejected' ? 'error' : 'warning'}>{icuStatus.request.status}</Badge>
                </p>
                {icuStatus.bed && (
                  <p className="text-text-secondary">Assigned bed: {icuStatus.bed.bed_number} {icuStatus.bed.ward ? `(${icuStatus.bed.ward})` : ''}</p>
                )}
                {icuStatus.admission && (
                  <p className="text-sm text-text-muted">Admitted: {formatDate(icuStatus.admission.admission_time)}</p>
                )}
                {icuStatus.monitoringSummary?.length > 0 && (
                  <p className="text-sm text-text-muted">Latest condition: {icuStatus.monitoringSummary[0]?.condition_status || '–'} at {formatDate(icuStatus.monitoringSummary[0]?.recorded_at)}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button variant="primary" onClick={() => setIcuReportModal(true)}>
                    <Eye className="h-4 w-4" /> View ICU Reports
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const data = icuReport || [];
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `icu-monitoring-report-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      setToast({ show: true, message: 'Report downloaded' });
                    }}
                  >
                    <Download className="h-4 w-4" /> Download Medical Report
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === TAB_TRANSFUSION && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Transfusion History</h2>
          <p className="text-sm text-text-secondary">Your blood transfusion records (read-only).</p>
          {transfusionLoading ? (
            <Card><p className="text-text-muted py-4">Loading…</p></Card>
          ) : transfusionHistory.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Droplets className="h-14 w-14 text-text-muted mb-3" />
                <p className="text-text-secondary">No transfusion records yet.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {transfusionHistory.map((log) => (
                <Card key={log.id}>
                  <p className="font-medium text-text-primary">Unit {log.unit_id?.slice(0, 8)}…</p>
                  <p className="text-sm text-text-secondary">
                    {log.doctor?.full_name && `Authorized by ${log.doctor.full_name}`} · {formatDate(log.transfusion_time)}
                  </p>
                  {log.notes && <p className="text-sm text-text-muted mt-1">{log.notes}</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={icuReportModal} onClose={() => setIcuReportModal(false)} title="ICU Monitoring Report">
        <div className="max-h-96 overflow-y-auto space-y-2">
          {icuReportLoading ? (
            <p className="text-text-muted">Loading…</p>
          ) : icuReport.length === 0 ? (
            <p className="text-text-muted">No monitoring records yet.</p>
          ) : (
            icuReport.map((log) => (
              <div key={log.id} className="rounded border border-border p-2 text-sm">
                <span className="text-text-muted">{formatDate(log.recorded_at)}</span>
                {log.condition_status && <Badge variant="primary" className="ml-2">{log.condition_status}</Badge>}
                {log.observation_notes && <p className="mt-1">{log.observation_notes}</p>}
                {log.vital_signs && Object.keys(log.vital_signs).length > 0 && (
                  <p className="text-text-muted">{JSON.stringify(log.vital_signs)}</p>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Book Appointment modal */}
      <Modal open={bookOpen} onClose={() => setBookOpen(false)} title="Book Appointment">
        <form onSubmit={handleBookSubmit} className="space-y-4">
          <Select
            label="Doctor"
            options={[
              { value: '', label: 'Select doctor' },
              ...(doctors || []).map((d) => ({
                value: d.id,
                label: `${d.full_name || d.email}${d.specialty ? ` (${d.specialty})` : ''}`,
              })),
            ]}
            value={bookForm.doctor_id}
            onChange={(e) => setBookForm((f) => ({ ...f, doctor_id: e.target.value }))}
            disabled={doctorsLoading}
          />
          <Input
            label="Date & time"
            type="datetime-local"
            value={bookForm.scheduled_at}
            onChange={(e) => setBookForm((f) => ({ ...f, scheduled_at: e.target.value }))}
            required
          />
          <Input
            label="Notes (optional)"
            value={bookForm.notes}
            onChange={(e) => setBookForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Reason for visit"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setBookOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={bookMutation.isPending}>
              {bookMutation.isPending ? 'Booking…' : 'Book'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toast.show && (
        <div
          className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-card px-4 py-3 text-sm font-medium text-white shadow-lg"
          style={{
            backgroundColor: toast.type === 'error' ? 'var(--color-error)' : 'var(--color-success)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
