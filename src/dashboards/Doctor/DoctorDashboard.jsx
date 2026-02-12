/**
 * Doctor Dashboard – Phase 2. Patients list, appointments (accept/reject),
 * medical record creator, prescription creator, ICU/Ambulance stub.
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
  useDoctorPatients,
  useDoctorAppointments,
  useDoctorRecords,
  useDoctorPrescriptions,
  useUpdateAppointmentStatus,
  useCreateRecord,
  useCreatePrescription,
  useEmergencyRequest,
  useRequestIcuAdmission,
  useDoctorIcuRequests,
  useDoctorIcuMonitoring,
  useCreateBloodRequest,
} from '../../hooks/useDoctorApi';
import { useBloodBankAvailability } from '../../hooks/useBloodBankApi';
import { Users, Calendar, FileText, Pill, Ambulance, User as UserIcon, Send, Eye, Droplets } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatTime(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function DoctorDashboard() {
  const [activeSection, setActiveSection] = useState('appointments');
  const [recordModal, setRecordModal] = useState(false);
  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [recordForm, setRecordForm] = useState({ patient_id: '', diagnosis: '', notes: '', observations: '' });
  const [prescriptionForm, setPrescriptionForm] = useState({
    patient_id: '', medication: '', dosage: '', instructions: '', frequency: '', duration: '', medical_record_id: '',
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [icuTransferOpen, setIcuTransferOpen] = useState(false);
  const [icuTransferForm, setIcuTransferForm] = useState({ patient_id: '', priority_level: 'medium', request_notes: '' });
  const [icuMonitoringPatient, setIcuMonitoringPatient] = useState(null);
  const [bloodRequestOpen, setBloodRequestOpen] = useState(false);
  const [bloodRequestForm, setBloodRequestForm] = useState({
    patient_id: '', blood_group_required: 'O+', units_required: 1, urgency_level: 'routine', medical_reason: '',
  });

  const { data: patients = [], isLoading: patientsLoading } = useDoctorPatients();
  const { data: appointments = [], isLoading: appointmentsLoading } = useDoctorAppointments();
  const { data: recordsForPatient = [] } = useDoctorRecords(prescriptionForm.patient_id || null);
  const updateStatus = useUpdateAppointmentStatus();
  const createRecord = useCreateRecord();
  const createPrescription = useCreatePrescription();
  const emergencyRequest = useEmergencyRequest();
  const requestIcuAdmission = useRequestIcuAdmission();
  const { data: icuRequests = [] } = useDoctorIcuRequests();
  const { data: icuMonitoringLogs = [] } = useDoctorIcuMonitoring(icuMonitoringPatient?.patient_id || null);
  const { data: bloodAvailability = {} } = useBloodBankAvailability();
  const createBloodRequestMutation = useCreateBloodRequest();

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show]);

  const handleAccept = async (apt) => {
    try {
      await updateStatus.mutateAsync({ id: apt.id, status: 'confirmed' });
      setToast({ show: true, message: 'Appointment confirmed' });
    } catch (err) {
      setToast({ show: true, message: err.message || 'Failed', type: 'error' });
    }
  };

  const handleRejectClick = (apt) => setRejectModal(apt);
  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    try {
      await updateStatus.mutateAsync({
        id: rejectModal.id,
        status: 'cancelled',
        notes: rejectReason.trim() || undefined,
      });
      setToast({ show: true, message: 'Appointment rejected' });
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      setToast({ show: true, message: err.message || 'Failed', type: 'error' });
    }
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordForm.patient_id) {
      setToast({ show: true, message: 'Select a patient', type: 'error' });
      return;
    }
    try {
      await createRecord.mutateAsync({
        patient_id: recordForm.patient_id,
        diagnosis: recordForm.diagnosis || null,
        notes: recordForm.notes || null,
        observations: recordForm.observations || null,
      });
      setToast({ show: true, message: 'Medical record created' });
      setRecordModal(false);
      setRecordForm({ patient_id: '', diagnosis: '', notes: '', observations: '' });
    } catch (err) {
      setToast({ show: true, message: err.message || 'Failed', type: 'error' });
    }
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!prescriptionForm.patient_id || !prescriptionForm.medication) {
      setToast({ show: true, message: 'Select patient and enter medication', type: 'error' });
      return;
    }
    try {
      await createPrescription.mutateAsync({
        patient_id: prescriptionForm.patient_id,
        medication: prescriptionForm.medication,
        dosage: prescriptionForm.dosage || null,
        instructions: prescriptionForm.instructions || null,
        frequency: prescriptionForm.frequency || null,
        duration: prescriptionForm.duration || null,
        medical_record_id: prescriptionForm.medical_record_id || null,
      });
      setToast({ show: true, message: 'Prescription created' });
      setPrescriptionModal(false);
      setPrescriptionForm({ patient_id: '', medication: '', dosage: '', instructions: '', frequency: '', duration: '', medical_record_id: '' });
    } catch (err) {
      setToast({ show: true, message: err.message || 'Failed', type: 'error' });
    }
  };

  const handleEmergencyStub = async (type) => {
    try {
      await emergencyRequest.mutateAsync({ type });
      setToast({ show: true, message: `${type === 'icu' ? 'ICU' : 'Ambulance'} request logged (stub)` });
    } catch (err) {
      setToast({ show: true, message: err.message || 'Request failed', type: 'error' });
    }
  };

  const handleRequestIcuTransfer = async (e) => {
    e.preventDefault();
    if (!icuTransferForm.patient_id) {
      setToast({ show: true, message: 'Select a patient', type: 'error' });
      return;
    }
    try {
      await requestIcuAdmission.mutateAsync({
        patient_id: icuTransferForm.patient_id,
        priority_level: icuTransferForm.priority_level,
        request_notes: icuTransferForm.request_notes || undefined,
      });
      setToast({ show: true, message: 'ICU admission requested. ICU staff will review.' });
      setIcuTransferOpen(false);
      setIcuTransferForm({ patient_id: '', priority_level: 'medium', request_notes: '' });
    } catch (err) {
      setToast({ show: true, message: err.message || 'Request failed', type: 'error' });
    }
  };

  const sections = [
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'record', label: 'New Record', icon: FileText },
    { id: 'prescription', label: 'New Prescription', icon: Pill },
    { id: 'blood', label: 'Blood Request', icon: Droplets },
    { id: 'ambulance', label: 'ICU / Ambulance', icon: Ambulance },
  ];

  const patientOptions = patients.map((p) => ({ value: p.id, label: `${p.full_name || p.email} (${p.email})` }));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="border-b border-border">
        <nav className="flex gap-4 overflow-x-auto" aria-label="Sections">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors touch-manipulation ${
                activeSection === s.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:border-border hover:text-text-primary'
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {activeSection === 'appointments' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-text-primary">Appointments</h2>
          {appointmentsLoading ? (
            <Card><p className="text-text-muted">Loading…</p></Card>
          ) : (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Pending requests</h3>
                {appointments.filter((a) => a.status === 'pending').length === 0 ? (
                  <Card><p className="text-text-muted">No pending requests.</p></Card>
                ) : (
                  <div className="space-y-3">
                    {appointments.filter((a) => a.status === 'pending').map((apt) => {
                      const patient = apt.patient || {};
                      return (
                        <Card key={apt.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                              <UserIcon className="h-5 w-5 text-text-muted" />
                            </span>
                            <div>
                              <p className="font-medium text-text-primary">{patient.full_name || patient.email || 'Patient'}</p>
                              <p className="text-sm text-text-muted">
                                {formatDate(apt.scheduled_at)} · {formatTime(apt.scheduled_at)}
                              </p>
                              {apt.notes && <p className="text-sm text-text-secondary">{apt.notes}</p>}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 shrink-0">
                            <Button variant="outline" className="text-sm" onClick={() => handleAccept(apt)} disabled={updateStatus.isPending}>
                              Accept
                            </Button>
                            <Button variant="outline" className="text-sm text-error" onClick={() => handleRejectClick(apt)} disabled={updateStatus.isPending}>
                              Reject
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </section>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Today&apos;s appointments</h3>
                {(() => {
                  const today = new Date().toDateString();
                  const todayApts = appointments.filter((a) => a.status !== 'pending' && a.status !== 'cancelled' && new Date(a.scheduled_at).toDateString() === today);
                  if (todayApts.length === 0) {
                    return <Card><p className="text-text-muted">No appointments scheduled for today.</p></Card>;
                  }
                  return (
                    <div className="space-y-3">
                      {todayApts.map((apt) => {
                        const patient = apt.patient || {};
                        return (
                          <Card key={apt.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                                <UserIcon className="h-5 w-5 text-text-muted" />
                              </span>
                              <div>
                                <p className="font-medium text-text-primary">{patient.full_name || patient.email || 'Patient'}</p>
                                <p className="text-sm text-text-muted">
                                  {formatTime(apt.scheduled_at)}
                                </p>
                                {apt.notes && <p className="text-sm text-text-secondary">{apt.notes}</p>}
                              </div>
                            </div>
                            <Badge variant={apt.status === 'confirmed' ? 'success' : 'primary'}>{apt.status}</Badge>
                          </Card>
                        );
                      })}
                    </div>
                  );
                })()}
              </section>
            </>
          )}
        </div>
      )}

      {activeSection === 'patients' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Assigned Patients</h2>
          {patientsLoading ? (
            <Card><p className="text-text-muted">Loading…</p></Card>
          ) : patients.length === 0 ? (
            <Card><p className="text-text-muted">No patients yet. Appointments will link patients here.</p></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {patients.map((p) => (
                <Card key={p.id} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-medium text-text-primary">
                    {(p.full_name || p.email || 'P').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">{p.full_name || '–'}</p>
                    <p className="truncate text-sm text-text-secondary">{p.email}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSection === 'record' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Create Medical Record</h2>
          <Card>
            <p className="text-text-secondary mb-4">Add a medical record for a patient you have seen.</p>
            <Button variant="primary" onClick={() => setRecordModal(true)}>
              + Create Medical Record
            </Button>
          </Card>
        </div>
      )}

      {activeSection === 'prescription' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Create Prescription</h2>
          <Card>
            <Button variant="primary" onClick={() => setPrescriptionModal(true)}>
              + Write Prescription
            </Button>
          </Card>
        </div>
      )}

      {activeSection === 'blood' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-text-primary">Blood Request</h2>
          <Card>
            <p className="text-text-secondary mb-2">
              Request blood for a patient. Blood bank will process and allocate. Check availability below before requesting.
            </p>
            <div className="mb-4 rounded-lg bg-surface-muted p-3 text-sm">
              <p className="font-medium text-text-primary mb-2">Blood availability (units)</p>
              <div className="flex flex-wrap gap-3">
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <span key={bg} className="text-text-secondary">{bg}: <strong>{bloodAvailability[bg] ?? 0}</strong></span>
                ))}
              </div>
            </div>
            <Button variant="primary" onClick={() => setBloodRequestOpen(true)}>
              <Droplets className="h-4 w-4" /> Request blood for patient
            </Button>
          </Card>
          <Modal open={bloodRequestOpen} onClose={() => setBloodRequestOpen(false)} title="Request blood">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!bloodRequestForm.patient_id) {
                  setToast({ show: true, message: 'Select a patient', type: 'error' });
                  return;
                }
                try {
                  await createBloodRequestMutation.mutateAsync(bloodRequestForm);
                  setToast({ show: true, message: 'Blood request submitted' });
                  setBloodRequestOpen(false);
                  setBloodRequestForm({ patient_id: '', blood_group_required: 'O+', units_required: 1, urgency_level: 'routine', medical_reason: '' });
                } catch (err) {
                  setToast({ show: true, message: err.message || 'Request failed', type: 'error' });
                }
              }}
              className="space-y-4"
            >
              <Select
                label="Patient"
                options={[{ value: '', label: 'Select patient' }, ...patientOptions]}
                value={bloodRequestForm.patient_id}
                onChange={(e) => setBloodRequestForm((f) => ({ ...f, patient_id: e.target.value }))}
              />
              <Select
                label="Blood group required"
                options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => ({ value: bg, label: bg }))}
                value={bloodRequestForm.blood_group_required}
                onChange={(e) => setBloodRequestForm((f) => ({ ...f, blood_group_required: e.target.value }))}
              />
              <Input
                label="Units required"
                type="number"
                min={1}
                value={bloodRequestForm.units_required}
                onChange={(e) => setBloodRequestForm((f) => ({ ...f, units_required: parseInt(e.target.value, 10) || 1 }))}
              />
              <Select
                label="Urgency"
                options={[
                  { value: 'routine', label: 'Routine' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'emergency', label: 'Emergency' },
                ]}
                value={bloodRequestForm.urgency_level}
                onChange={(e) => setBloodRequestForm((f) => ({ ...f, urgency_level: e.target.value }))}
              />
              <Input
                label="Medical reason"
                value={bloodRequestForm.medical_reason}
                onChange={(e) => setBloodRequestForm((f) => ({ ...f, medical_reason: e.target.value }))}
                placeholder="e.g. Scheduled surgery preparation"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setBloodRequestOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={createBloodRequestMutation.isPending}>
                  {createBloodRequestMutation.isPending ? 'Submitting…' : 'Submit request'}
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {activeSection === 'ambulance' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-text-primary">ICU & Ambulance</h2>

          {/* Request ICU Transfer */}
          <Card>
            <h3 className="font-semibold text-text-primary">Request ICU Transfer</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Request ICU admission for a patient. ICU staff will approve or reject and assign a bed.
            </p>
            <Button variant="primary" className="mt-4" onClick={() => setIcuTransferOpen(true)}>
              <Send className="h-4 w-4" /> Request ICU Transfer
            </Button>
          </Card>

          {/* View ICU Patient Progress */}
          <Card>
            <h3 className="font-semibold text-text-primary">View ICU Patient Progress</h3>
            <p className="mt-1 text-sm text-text-secondary">
              ICU status and monitoring reports for patients you requested for ICU.
            </p>
            {icuRequests.length === 0 ? (
              <p className="mt-4 text-text-muted">No ICU requests yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {icuRequests.map((req) => (
                  <li key={req.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border p-3">
                    <div>
                      <span className="font-medium text-text-primary">{req.patient?.full_name || req.patient_id}</span>
                      <span className="ml-2 text-sm text-text-secondary">
                        Priority: {req.priority_level} · {req.bed ? `Bed ${req.bed.bed_number}` : req.request_status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={req.request_status === 'approved' ? 'success' : req.request_status === 'rejected' ? 'error' : 'warning'}>
                        {req.request_status}
                      </Badge>
                      <Button
                        variant="outline"
                        className="!py-1.5 !text-xs"
                        onClick={() => setIcuMonitoringPatient(req)}
                      >
                        <Eye className="h-3 w-3" /> View ICU Monitoring
                      </Button>
                      <Button
                        variant="outline"
                        className="!py-1.5 !text-xs"
                        onClick={() => { setRecordModal(true); setRecordForm((f) => ({ ...f, patient_id: req.patient_id })); }}
                      >
                        Update Treatment Plan
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <p className="text-text-secondary text-sm">Ambulance requests (stub).</p>
            <Button variant="outline" className="mt-2" onClick={() => handleEmergencyStub('ambulance')} disabled={emergencyRequest.isPending}>
              Request Ambulance
            </Button>
          </Card>
        </div>
      )}

      <Modal open={recordModal} onClose={() => setRecordModal(false)} title="Create Medical Record">
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <Select
            label="Patient"
            options={[{ value: '', label: 'Select patient' }, ...patientOptions]}
            value={recordForm.patient_id}
            onChange={(e) => setRecordForm((f) => ({ ...f, patient_id: e.target.value }))}
          />
          <Input
            label="Diagnosis"
            value={recordForm.diagnosis}
            onChange={(e) => setRecordForm((f) => ({ ...f, diagnosis: e.target.value }))}
            placeholder="Diagnosis"
          />
          <Input
            label="Notes"
            value={recordForm.notes}
            onChange={(e) => setRecordForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Clinical notes"
          />
          <Input
            label="Observations"
            value={recordForm.observations}
            onChange={(e) => setRecordForm((f) => ({ ...f, observations: e.target.value }))}
            placeholder="Observations"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setRecordModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={createRecord.isPending}>
              {createRecord.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(''); }} title="Reject appointment">
        <div className="space-y-4">
          {rejectModal && (
            <p className="text-text-secondary text-sm">
              Optional reason for rejecting this appointment (patient will not see this in Phase 2; for your notes).
            </p>
          )}
          <Input
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Slot no longer available"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</Button>
            <Button type="button" variant="primary" className="bg-error hover:opacity-90" onClick={handleRejectConfirm} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? 'Rejecting…' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={icuTransferOpen} onClose={() => setIcuTransferOpen(false)} title="Request ICU Transfer">
        <form onSubmit={handleRequestIcuTransfer} className="space-y-4">
          <Select
            label="Patient"
            options={[{ value: '', label: 'Select patient' }, ...patientOptions]}
            value={icuTransferForm.patient_id}
            onChange={(e) => setIcuTransferForm((f) => ({ ...f, patient_id: e.target.value }))}
          />
          <Select
            label="Priority / Emergency level"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'critical', label: 'Critical' },
            ]}
            value={icuTransferForm.priority_level}
            onChange={(e) => setIcuTransferForm((f) => ({ ...f, priority_level: e.target.value }))}
          />
          <Input
            label="Reason for ICU / Notes"
            value={icuTransferForm.request_notes}
            onChange={(e) => setIcuTransferForm((f) => ({ ...f, request_notes: e.target.value }))}
            placeholder="Clinical reason, emergency notes"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIcuTransferOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={requestIcuAdmission.isPending}>
              {requestIcuAdmission.isPending ? 'Submitting…' : 'Request ICU Transfer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!icuMonitoringPatient} onClose={() => setIcuMonitoringPatient(null)} title="View ICU Monitoring">
        {icuMonitoringPatient && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Patient: <strong>{icuMonitoringPatient.patient?.full_name}</strong> (read-only)
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {icuMonitoringLogs.length === 0 ? (
                <p className="text-text-muted">No monitoring logs yet.</p>
              ) : (
                icuMonitoringLogs.map((log) => (
                  <div key={log.id} className="rounded border border-border bg-surface-muted/50 p-2 text-sm">
                    <span className="text-text-secondary">{formatDate(log.recorded_at)}</span>
                    {log.condition_status && <Badge variant="primary" className="ml-2">{log.condition_status}</Badge>}
                    {log.observation_notes && <p className="mt-1">{log.observation_notes}</p>}
                    {log.vital_signs && Object.keys(log.vital_signs).length > 0 && (
                      <p className="mt-1 text-text-muted">{JSON.stringify(log.vital_signs)}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={prescriptionModal} onClose={() => setPrescriptionModal(false)} title="Write Prescription">
        <form onSubmit={handlePrescriptionSubmit} className="space-y-4">
          <Select
            label="Patient"
            options={[{ value: '', label: 'Select patient' }, ...patientOptions]}
            value={prescriptionForm.patient_id}
            onChange={(e) => setPrescriptionForm((f) => ({ ...f, patient_id: e.target.value }))}
          />
          <Input
            label="Medication"
            value={prescriptionForm.medication}
            onChange={(e) => setPrescriptionForm((f) => ({ ...f, medication: e.target.value }))}
            placeholder="Medication name"
            required
          />
          <Input
            label="Dosage"
            value={prescriptionForm.dosage}
            onChange={(e) => setPrescriptionForm((f) => ({ ...f, dosage: e.target.value }))}
            placeholder="e.g. 10mg"
          />
          <Input
            label="Frequency"
            value={prescriptionForm.frequency}
            onChange={(e) => setPrescriptionForm((f) => ({ ...f, frequency: e.target.value }))}
            placeholder="e.g. Twice daily"
          />
          <Input
            label="Duration"
            value={prescriptionForm.duration}
            onChange={(e) => setPrescriptionForm((f) => ({ ...f, duration: e.target.value }))}
            placeholder="e.g. 7 days"
          />
          <Input
            label="Instructions / Notes"
            value={prescriptionForm.instructions}
            onChange={(e) => setPrescriptionForm((f) => ({ ...f, instructions: e.target.value }))}
            placeholder="Additional instructions"
          />
          <Select
            label="Link to medical record (optional)"
            options={[
              { value: '', label: 'None' },
              ...recordsForPatient.map((r) => ({
                value: r.id,
                label: `${formatDate(r.created_at)} – ${(r.diagnosis || 'No diagnosis').slice(0, 40)}`,
              })),
            ]}
            value={prescriptionForm.medical_record_id}
            onChange={(e) => setPrescriptionForm((f) => ({ ...f, medical_record_id: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setPrescriptionModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={createPrescription.isPending}>
              {createPrescription.isPending ? 'Saving…' : 'Create'}
            </Button>
          </div>
        </form>
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
