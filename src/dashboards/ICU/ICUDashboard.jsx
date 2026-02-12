/**
 * ICU Management Dashboard – bed availability, KPIs, Update Bed Status modal.
 * Pixel-aligned to provided UI: KPIs (Total, Available, Occupied, Occupancy %), bed cards, status modal.
 */
import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select } from '../../components/common';
import {
  useIcuDashboard,
  useUpdateBedStatus,
  useIcuActivePatients,
  useCreateBloodRequest,
} from '../../hooks/useIcuApi';
import { Bed, Check, Users, Activity, Droplets } from 'lucide-react';
import IcuPageNav from './IcuPageNav';

const BED_STATUS_OPTIONS = [
  { value: 'available', label: 'Available', colorClass: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'occupied', label: 'Occupied', colorClass: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'reserved', label: 'Reserved', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'maintenance', label: 'Maintenance', colorClass: 'bg-gray-100 text-gray-700 border-gray-200' },
];

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

function getStatusStyle(status) {
  switch (status) {
    case 'occupied':
      return { border: 'border-l-4 border-red-400', badge: 'error', bg: 'bg-red-50/50' };
    case 'available':
      return { border: 'border-l-4 border-green-400', badge: 'success', bg: 'bg-green-50/50' };
    case 'reserved':
      return { border: 'border-l-4 border-blue-400', badge: 'info', bg: 'bg-blue-50/50' };
    case 'maintenance':
    default:
      return { border: 'border-l-4 border-gray-300', badge: 'default', bg: 'bg-gray-50/50' };
  }
}

function formatAdmissionDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function ICUDashboard() {
  const [statusModal, setStatusModal] = useState(null);
  const [bloodRequestOpen, setBloodRequestOpen] = useState(false);
  const [bloodRequestForm, setBloodRequestForm] = useState({
    patient_id: '', blood_group_required: 'O+', units_required: 1, medical_reason: '',
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const { data, isLoading, isError, error, refetch } = useIcuDashboard();
  const updateBedStatus = useUpdateBedStatus();
  const { data: activePatients = [] } = useIcuActivePatients();
  const createBloodRequest = useCreateBloodRequest();

  const beds = data?.beds || [];
  const stats = data?.stats || {};
  const admissionRequests = data?.admissionRequests || [];

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show]);

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });
  const onError = (err) => showToast(err?.message || 'Failed', 'error');

  const handleUpdateStatus = (newStatus) => {
    if (!statusModal) return;
    updateBedStatus.mutate(
      { bedId: statusModal.id, status: newStatus },
      {
        onSuccess: () => {
          showToast('Bed status updated');
          setStatusModal(null);
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
      {/* <IcuPageNav /> */}
      {/* KPI cards – match screenshot */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Bed}
          label="Total Beds"
          value={stats.totalBeds ?? 0}
          iconBg="#e9d5ff"
        />
        <StatCard
          icon={Check}
          label="Available Beds"
          value={stats.availableBeds ?? 0}
          iconBg="#bbf7d0"
        />
        <StatCard
          icon={Users}
          label="Occupied Beds"
          value={stats.occupiedBeds ?? 0}
          iconBg="#fecaca"
        />
        <StatCard
          icon={Activity}
          label="Occupancy Rate"
          value={stats.occupancyRate != null ? `${stats.occupancyRate}%` : '0%'}
          iconBg="#e9d5ff"
        />
      </div>

      {/* ICU Bed Status */}
      <Card className="space-y-4" hover={false}>
        <h2 className="text-lg font-bold text-text-primary">ICU Bed Status</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {beds.map((bed) => {
            const style = getStatusStyle(bed.status);
            const statusLabel = bed.status ? bed.status.charAt(0).toUpperCase() + bed.status.slice(1) : '–';
            const wardFloor = [bed.ward, bed.floor].filter(Boolean).join(' • ') || '–';
            const equipmentList = Array.isArray(bed.equipment_list) ? bed.equipment_list : [];

            return (
              <div
                key={bed.id}
                className={`rounded-card border border-border bg-surface p-4 shadow-card ${style.border} ${style.bg}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-text-primary">{bed.bed_number || '–'}</p>
                    <p className="text-sm text-text-secondary">{wardFloor}</p>
                  </div>
                  <Badge variant={style.badge}>{statusLabel}</Badge>
                </div>

                {bed.status === 'occupied' && (bed.patient || bed.admission_time) && (
                  <div className="mt-3 rounded-lg bg-white p-3 shadow-sm">
                    <p className="font-medium text-text-primary">{bed.patient?.full_name || 'Patient'}</p>
                    <p className="text-sm text-text-secondary">
                      Admitted: {formatAdmissionDate(bed.admission_time)}
                    </p>
                  </div>
                )}

                {equipmentList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {equipmentList.map((eq) => (
                      <span
                        key={eq}
                        className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                )}

                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  onClick={() => setStatusModal(bed)}
                >
                  Update Status
                </Button>
              </div>
            );
          })}
        </div>

        {beds.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-text-muted">No ICU beds configured. Admin can add beds.</p>
            <p className="mt-2 text-sm text-text-secondary">
              Use <strong>Admission Requests</strong> above to approve or reject requests. Use <strong>Patient Monitoring</strong> to record vitals and discharge.
            </p>
          </div>
        )}
      </Card>

      {/* Pending admission requests – compact list */}
      {admissionRequests.length > 0 && (
        <Card className="space-y-3" hover={false}>
          <h2 className="text-lg font-bold text-text-primary">Admission Requests</h2>
          <p className="text-sm text-text-secondary">
            {admissionRequests.length} pending. Use the Admission Requests page to approve or reject.
          </p>
        </Card>
      )}

      {/* Emergency blood request */}
      <Card className="space-y-3" hover={false}>
        <h2 className="text-lg font-bold text-text-primary">Emergency blood</h2>
        <p className="text-sm text-text-secondary">
          Request blood for a patient. Requests are marked emergency and prioritized by the blood bank.
        </p>
        <Button variant="primary" onClick={() => setBloodRequestOpen(true)}>
          <Droplets className="h-4 w-4" /> Request emergency blood
        </Button>
      </Card>

      {/* Blood request modal */}
      <Modal open={bloodRequestOpen} onClose={() => setBloodRequestOpen(false)} title="Request emergency blood">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!bloodRequestForm.patient_id) {
              setToast({ show: true, message: 'Select patient', type: 'error' });
              return;
            }
            createBloodRequest.mutate(bloodRequestForm, {
              onSuccess: () => {
                showToast('Blood request submitted');
                setBloodRequestOpen(false);
                setBloodRequestForm({ patient_id: '', blood_group_required: 'O+', units_required: 1, medical_reason: '' });
              },
              onError: (err) => showToast(err?.message || 'Failed', 'error'),
            });
          }}
          className="space-y-4"
        >
          <Select
            label="Patient"
            options={[
              { value: '', label: 'Select patient' },
              ...activePatients.map((p) => ({ value: p.patient_id || p.id, label: p.patient?.full_name || p.patient_id || p.id })),
            ]}
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
          <Input
            label="Medical reason"
            value={bloodRequestForm.medical_reason}
            onChange={(e) => setBloodRequestForm((f) => ({ ...f, medical_reason: e.target.value }))}
            placeholder="e.g. Severe blood loss"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setBloodRequestOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={createBloodRequest.isPending}>Submit</Button>
          </div>
        </form>
      </Modal>

      {/* Update Bed Status modal – pixel match */}
      <Modal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title="Update Bed Status"
      >
        {statusModal && (
          <div className="space-y-4">
            <p className="text-text-secondary">
              Bed: <span className="font-semibold text-text-primary">{statusModal.bed_number}</span>
            </p>
            <div className="flex flex-col gap-2">
              {BED_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleUpdateStatus(opt.value)}
                  disabled={updateBedStatus.isPending}
                  className={`rounded-button border px-4 py-3 text-left font-medium transition-opacity hover:opacity-90 disabled:opacity-50 ${opt.colorClass}`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                className="rounded-button border border-gray-200 bg-gray-100 px-4 py-3 text-left font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {toast.show && (
        <div
          className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-button px-4 py-2 text-sm font-medium text-white ${
            toast.type === 'error' ? 'bg-error' : 'bg-primary'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
