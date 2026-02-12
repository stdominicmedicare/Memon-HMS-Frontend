/**
 * ICU Patient Monitoring – vitals, condition, emergency alert, transfer bed, transfer to ward, request ambulance.
 */
import { useState } from 'react';
import { Card, Button, Input, Select, Modal } from '../../components/common';
import {
  useIcuDashboard,
  useIcuActivePatients,
  useIcuMonitoringLogs,
  useAddIcuMonitoringLog,
  useDischargeIcuPatient,
  useTransferBed,
  useRequestAmbulanceTransfer,
} from '../../hooks/useIcuApi';
import IcuPageNav from './IcuPageNav';
import { AlertTriangle, ArrowRightLeft, Ambulance } from 'lucide-react';

const CONDITION_OPTIONS = [
  { value: '', label: 'Select condition' },
  { value: 'stable', label: 'Stable' },
  { value: 'improving', label: 'Improving' },
  { value: 'critical', label: 'Critical' },
  { value: 'emergency', label: 'Emergency' },
];

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function PatientMonitoring() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dischargeModal, setDischargeModal] = useState(null);
  const [vitals, setVitals] = useState({
    temperature: '',
    heart_rate: '',
    blood_pressure: '',
    oxygen_level: '',
  });
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState('');
  const [transferBedModal, setTransferBedModal] = useState(null);
  const [ambulanceModal, setAmbulanceModal] = useState(null);
  const [emergencyAlertOpen, setEmergencyAlertOpen] = useState(false);
  const [emergencyNotes, setEmergencyNotes] = useState('');

  const { data: dashboardData } = useIcuDashboard();
  const { data: activePatients = [], isLoading } = useIcuActivePatients();
  const { data: logs = [] } = useIcuMonitoringLogs(selectedPatient?.patient_id);
  const addLog = useAddIcuMonitoringLog();
  const discharge = useDischargeIcuPatient();
  const transferBed = useTransferBed();
  const requestAmbulance = useRequestAmbulanceTransfer();

  const availableBeds = (dashboardData?.beds || []).filter((b) => b.status === 'available' && b.id !== selectedPatient?.bed_id);

  const handleAddLog = () => {
    if (!selectedPatient) return;
    const payload = {
      patient_id: selectedPatient.patient_id,
      bed_id: selectedPatient.bed_id,
      admission_record_id: selectedPatient.id,
      vital_signs: {
        temperature: vitals.temperature ? String(vitals.temperature) : undefined,
        heart_rate: vitals.heart_rate ? String(vitals.heart_rate) : undefined,
        blood_pressure: vitals.blood_pressure ? String(vitals.blood_pressure) : undefined,
        oxygen_level: vitals.oxygen_level ? String(vitals.oxygen_level) : undefined,
      },
      observation_notes: notes.trim() || undefined,
      condition_status: condition || undefined,
    };
    addLog.mutate(payload, {
      onSuccess: () => {
        setVitals({ temperature: '', heart_rate: '', blood_pressure: '', oxygen_level: '' });
        setNotes('');
        setCondition('');
      },
      onError: (e) => alert(e?.message || 'Failed'),
    });
  };

  const handleDischarge = () => {
    if (!dischargeModal) return;
    discharge.mutate(
      {
        admissionRecordId: dischargeModal.id,
        discharge_reason: dischargeModal.discharge_reason,
        final_status: dischargeModal.final_status,
      },
      {
        onSuccess: () => setDischargeModal(null),
        onError: (e) => alert(e?.message || 'Failed'),
      }
    );
  };

  const handleSendEmergencyAlert = () => {
    if (!selectedPatient) return;
    addLog.mutate(
      {
        patient_id: selectedPatient.patient_id,
        bed_id: selectedPatient.bed_id,
        admission_record_id: selectedPatient.id,
        condition_status: 'emergency',
        observation_notes: emergencyNotes.trim() || 'Emergency alert raised by ICU staff',
      },
      {
        onSuccess: () => { setEmergencyNotes(''); setEmergencyAlertOpen(false); alert('Emergency alert recorded.'); },
        onError: (e) => alert(e?.message || 'Failed'),
      }
    );
  };

  const handleTransferBed = () => {
    if (!transferBedModal?.admissionRecordId || !transferBedModal?.new_bed_id) return;
    transferBed.mutate(
      { admissionRecordId: String(transferBedModal.admissionRecordId), new_bed_id: transferBedModal.new_bed_id },
      {
        onSuccess: () => setTransferBedModal(null),
        onError: (e) => alert(e?.message || 'Failed'),
      }
    );
  };

  const handleRequestAmbulance = () => {
    if (!ambulanceModal?.patient_id || !ambulanceModal?.to_address) {
      alert('Enter destination address');
      return;
    }
    requestAmbulance.mutate(
      { patient_id: ambulanceModal.patient_id, to_address: ambulanceModal.to_address, priority: ambulanceModal.priority || 'High' },
      {
        onSuccess: () => { setAmbulanceModal(null); alert('Ambulance transfer requested.'); },
        onError: (e) => alert(e?.message || 'Failed'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* <IcuPageNav /> */}
      <h1 className="text-xl font-bold text-text-primary">ICU Patient Monitoring</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card hover={false}>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Active ICU Patients</h2>
          {activePatients.length === 0 ? (
            <p className="py-6 text-center text-text-muted">No patients currently in ICU.</p>
          ) : !selectedPatient ? (
            <p className="py-4 text-center text-sm text-text-secondary">
              Select a patient below to record vitals, add observation notes, or discharge.
            </p>
          ) : null}
          {activePatients.length > 0 ? (
            <ul className="space-y-2">
              {activePatients.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(p)}
                    className={`w-full rounded-button border p-3 text-left transition-colors ${
                      selectedPatient?.id === p.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-surface-muted'
                    }`}
                  >
                    <span className="font-medium text-text-primary">{p.patient?.full_name || p.patient_id}</span>
                    <span className="ml-2 text-sm text-text-secondary">
                      {p.bed?.bed_number} • Admitted {formatDate(p.admission_time)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        {selectedPatient && (
          <Card hover={false}>
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              Monitoring: {selectedPatient.patient?.full_name}
            </h2>
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Temperature (°C)"
                  value={vitals.temperature}
                  onChange={(e) => setVitals((prev) => ({ ...prev, temperature: e.target.value }))}
                />
                <Input
                  placeholder="Heart rate (bpm)"
                  value={vitals.heart_rate}
                  onChange={(e) => setVitals((prev) => ({ ...prev, heart_rate: e.target.value }))}
                />
                <Input
                  placeholder="Blood pressure"
                  value={vitals.blood_pressure}
                  onChange={(e) => setVitals((prev) => ({ ...prev, blood_pressure: e.target.value }))}
                />
                <Input
                  placeholder="Oxygen %"
                  value={vitals.oxygen_level}
                  onChange={(e) => setVitals((prev) => ({ ...prev, oxygen_level: e.target.value }))}
                />
              </div>
              <Select
                options={CONDITION_OPTIONS}
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              />
              <Input
                placeholder="Observation notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                variant="primary"
                onClick={handleAddLog}
                disabled={addLog.isPending}
              >
                Add Vital Record
              </Button>
              <Button
                variant="outline"
                className="!border-warning !text-warning"
                onClick={() => setEmergencyAlertOpen(true)}
              >
                <AlertTriangle className="h-4 w-4" /> Send Emergency Alert
              </Button>
            </div>

            <hr className="my-4 border-border" />
            <h3 className="mb-2 font-medium text-text-primary">Recent logs</h3>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {logs.slice(0, 10).map((log) => (
                <li key={log.id} className="rounded border border-border bg-surface-muted/50 p-2 text-sm">
                  {log.recorded_at && formatDate(log.recorded_at)} — {log.condition_status || '–'}
                  {log.observation_notes && ` • ${log.observation_notes}`}
                  {Object.keys(log.vital_signs || {}).length ? ` • ${JSON.stringify(log.vital_signs)}` : ''}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setDischargeModal({ id: selectedPatient.id, discharge_reason: '', final_status: '' })}
              >
                Discharge Patient
              </Button>
              <Button
                variant="outline"
                onClick={() => setDischargeModal({ id: selectedPatient.id, discharge_reason: 'Transfer to ward', final_status: '' })}
              >
                Transfer To Ward
              </Button>
              <Button
                variant="outline"
                onClick={() => setTransferBedModal({ admissionRecordId: selectedPatient.id, new_bed_id: '' })}
                disabled={availableBeds.length === 0}
              >
                <ArrowRightLeft className="h-4 w-4" /> Transfer to Another Bed
              </Button>
              <Button
                variant="outline"
                onClick={() => setAmbulanceModal({ patient_id: selectedPatient.patient_id, to_address: '', priority: 'High' })}
              >
                <Ambulance className="h-4 w-4" /> Request Ambulance Transfer
              </Button>
            </div>
          </Card>
        )}
      </div>

      {dischargeModal && (
        <Modal
          open={!!dischargeModal}
          onClose={() => setDischargeModal(null)}
          title="Discharge Patient"
        >
          <div className="space-y-4">
            <Input
              placeholder="Discharge reason"
              value={dischargeModal.discharge_reason}
              onChange={(e) => setDischargeModal((p) => ({ ...p, discharge_reason: e.target.value }))}
            />
            <Input
              placeholder="Final status"
              value={dischargeModal.final_status}
              onChange={(e) => setDischargeModal((p) => ({ ...p, final_status: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleDischarge} disabled={discharge.isPending}>
                Confirm Discharge
              </Button>
              <Button variant="outline" onClick={() => setDischargeModal(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <Modal open={emergencyAlertOpen} onClose={() => setEmergencyAlertOpen(false)} title="Send Emergency Alert">
        <div className="space-y-4">
          <Input
            placeholder="Optional notes"
            value={emergencyNotes}
            onChange={(e) => setEmergencyNotes(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="primary" className="!bg-warning" onClick={handleSendEmergencyAlert} disabled={addLog.isPending}>
              Send Emergency Alert
            </Button>
            <Button variant="outline" onClick={() => setEmergencyAlertOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {transferBedModal && (
        <Modal open onClose={() => setTransferBedModal(null)} title="Transfer Patient to Another Bed">
          <div className="space-y-4">
            <Select
              options={[{ value: '', label: 'Select bed' }, ...availableBeds.map((b) => ({ value: b.id, label: b.bed_number }))]}
              value={transferBedModal.new_bed_id}
              onChange={(e) => setTransferBedModal((p) => ({ ...p, new_bed_id: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleTransferBed} disabled={!transferBedModal.new_bed_id || transferBed.isPending}>
                Transfer
              </Button>
              <Button variant="outline" onClick={() => setTransferBedModal(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {ambulanceModal && (
        <Modal open onClose={() => setAmbulanceModal(null)} title="Request Ambulance Transfer">
          <div className="space-y-4">
            <Input
              placeholder="Destination (e.g. other hospital)"
              value={ambulanceModal.to_address}
              onChange={(e) => setAmbulanceModal((p) => ({ ...p, to_address: e.target.value }))}
            />
            <Select
              options={[{ value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]}
              value={ambulanceModal.priority}
              onChange={(e) => setAmbulanceModal((p) => ({ ...p, priority: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleRequestAmbulance} disabled={requestAmbulance.isPending}>
                Request Transfer
              </Button>
              <Button variant="outline" onClick={() => setAmbulanceModal(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
