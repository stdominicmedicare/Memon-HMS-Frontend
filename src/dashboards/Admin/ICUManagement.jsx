/**
 * Admin ICU Management – Manage ICU Beds (Add, Edit, Remove, Mark Maintenance, Change Status),
 * ICU Analytics (Utilization, Admission History, Occupancy Alerts), link to Assign ICU Staff.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Select,
} from '../../components/common';
import {
  useAdminIcuBeds,
  useAdminCreateIcuBed,
  useAdminUpdateIcuBed,
  useAdminDeleteIcuBed,
  useAdminIcuAnalytics,
} from '../../hooks/useAdminIcuApi';
import { Plus, Pencil, Trash2, Wrench, RefreshCw, BarChart3, History, AlertTriangle, Users } from 'lucide-react';

const BED_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'maintenance', label: 'Maintenance' },
];

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function ICUManagement() {
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ bed_number: '', bed_type: 'ICU-A', ward: '', floor: '', equipment_list: '' });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const { data: beds = [], isLoading } = useAdminIcuBeds();
  const { data: analytics, isLoading: analyticsLoading } = useAdminIcuAnalytics();
  const createBed = useAdminCreateIcuBed();
  const updateBed = useAdminUpdateIcuBed();
  const deleteBed = useAdminDeleteIcuBed();

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });
  const onError = (e) => showToast(e?.message || 'Failed', 'error');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!form.bed_number?.trim() || !form.bed_type?.trim()) {
      showToast('Bed number and type required', 'error');
      return;
    }
    const equipment = form.equipment_list
      ? form.equipment_list.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    createBed.mutate(
      {
        bed_number: form.bed_number.trim(),
        bed_type: form.bed_type.trim(),
        ward: form.ward?.trim() || null,
        floor: form.floor?.trim() || null,
        equipment_list: equipment,
      },
      {
        onSuccess: () => {
          showToast('ICU bed added');
          setAddModal(false);
          setForm({ bed_number: '', bed_type: 'ICU-A', ward: '', floor: '', equipment_list: '' });
        },
        onError,
      }
    );
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editModal) return;
    const equipment = (editModal.equipment_list || []).length
      ? editModal.equipment_list
      : (typeof editModal.equipment_list === 'string'
          ? editModal.equipment_list.split(',').map((s) => s.trim()).filter(Boolean)
          : []);
    updateBed.mutate(
      {
        id: editModal.id,
        bed_type: editModal.bed_type,
        ward: editModal.ward ?? '',
        floor: editModal.floor ?? '',
        equipment_list: equipment,
      },
      {
        onSuccess: () => {
          showToast('Bed updated');
          setEditModal(null);
        },
        onError,
      }
    );
  };

  const handleStatusChange = (bedId, status) => {
    updateBed.mutate(
      { id: bedId, status },
      {
        onSuccess: () => {
          showToast('Bed status updated');
          setStatusModal(null);
        },
        onError,
      }
    );
  };

  const handleMarkMaintenance = (bed) => {
    updateBed.mutate(
      { id: bed.id, status: 'maintenance' },
      {
        onSuccess: () => showToast('Bed marked for maintenance'),
        onError,
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    deleteBed.mutate(deleteConfirm.id, {
      onSuccess: () => {
        showToast('Bed removed');
        setDeleteConfirm(null);
      },
      onError,
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text-primary">ICU Management</h1>

      {/* Manage ICU Beds */}
      <Card hover={false}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-text-primary">Manage ICU Beds</h2>
          <Button variant="primary" onClick={() => setAddModal(true)}>
            <Plus className="h-4 w-4" /> Add ICU Bed
          </Button>
        </div>
        {isLoading ? (
          <p className="py-6 text-text-muted">Loading…</p>
        ) : beds.length === 0 ? (
          <p className="py-6 text-text-muted">No ICU beds. Add one to configure capacity.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="pb-2 pr-4 font-medium">Bed</th>
                  <th className="pb-2 pr-4 font-medium">Type / Ward / Floor</th>
                  <th className="pb-2 pr-4 font-medium">Equipment</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {beds.map((bed) => (
                  <tr key={bed.id} className="border-b border-border">
                    <td className="py-3 pr-4 font-medium text-text-primary">{bed.bed_number}</td>
                    <td className="py-3 pr-4 text-text-secondary">
                      {bed.bed_type} {bed.ward ? `• ${bed.ward}` : ''} {bed.floor ? `• ${bed.floor}` : ''}
                    </td>
                    <td className="py-3 pr-4 text-text-secondary">
                      {Array.isArray(bed.equipment_list) ? bed.equipment_list.join(', ') || '–' : '–'}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={
                          bed.status === 'available' ? 'success' : bed.status === 'occupied' ? 'error' : bed.status === 'reserved' ? 'primary' : 'default'
                        }
                      >
                        {bed.status}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="!py-1.5 !text-xs"
                          onClick={() => setEditModal({ ...bed })}
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="!py-1.5 !text-xs"
                          onClick={() => setStatusModal(bed)}
                        >
                          <RefreshCw className="h-3 w-3" /> Change Status
                        </Button>
                        {bed.status !== 'maintenance' && (
                          <Button
                            variant="outline"
                            className="!py-1.5 !text-xs"
                            onClick={() => handleMarkMaintenance(bed)}
                            disabled={updateBed.isPending}
                          >
                            <Wrench className="h-3 w-3" /> Mark Maintenance
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="!py-1.5 !text-xs !text-error"
                          onClick={() => setDeleteConfirm(bed)}
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Assign ICU Staff – link to Role Assignment */}
      <Card hover={false}>
        <h2 className="text-lg font-bold text-text-primary">Assign ICU Staff</h2>
        <p className="mt-2 text-text-secondary">
          Assign or change the ICU role for users. ICU staff can manage admissions, beds, and monitoring.
        </p>
        <Link to="/admin/roles">
          <Button variant="primary" className="mt-4">
            <Users className="h-4 w-4" /> Open Role Assignment
          </Button>
        </Link>
      </Card>

      {/* ICU Analytics */}
      <Card hover={false}>
        <h2 className="text-lg font-bold text-text-primary">ICU Analytics / Overview</h2>
        {analyticsLoading ? (
          <p className="py-4 text-text-muted">Loading analytics…</p>
        ) : analytics ? (
          <div className="mt-4 space-y-6">
            <div className="flex flex-wrap gap-4">
              <div className="rounded-card border border-border bg-surface-muted/50 px-4 py-3">
                <p className="text-sm text-text-secondary">Utilization</p>
                <p className="text-xl font-bold text-text-primary">
                  Total: {analytics.utilization?.total ?? 0} · Available: {analytics.utilization?.available ?? 0} ·
                  Occupied: {analytics.utilization?.occupied ?? 0} · Occupancy: {analytics.utilization?.occupancyRate ?? 0}%
                </p>
              </div>
            </div>
            {analytics.alerts?.length > 0 && (
              <div className="rounded-card border border-warning/50 bg-warning/10 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-warning">
                  <AlertTriangle className="h-5 w-5" /> Occupancy Alerts
                </h3>
                <ul className="mt-2 list-inside list-disc text-sm text-text-secondary">
                  {analytics.alerts.map((a, i) => (
                    <li key={i}>{a.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-text-primary">
                <History className="h-5 w-5" /> ICU Admission History (recent)
              </h3>
              <div className="mt-2 max-h-64 overflow-y-auto">
                {!analytics.admissionHistory?.length ? (
                  <p className="text-text-muted">No admission records yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-secondary">
                        <th className="py-2 pr-2 text-left">Patient</th>
                        <th className="py-2 pr-2 text-left">Bed</th>
                        <th className="py-2 pr-2 text-left">Admission</th>
                        <th className="py-2 text-left">Discharge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.admissionHistory.map((r) => (
                        <tr key={r.id} className="border-b border-border">
                          <td className="py-2 pr-2">{r.patient?.full_name || '–'}</td>
                          <td className="py-2 pr-2">{r.bed?.bed_number || '–'}</td>
                          <td className="py-2 pr-2">{formatDate(r.admission_time)}</td>
                          <td className="py-2">{formatDate(r.discharge_time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Add Bed Modal */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add ICU Bed">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Bed number"
            value={form.bed_number}
            onChange={(e) => setForm((p) => ({ ...p, bed_number: e.target.value }))}
            placeholder="e.g. ICU-101"
            required
          />
          <Input
            label="Bed type"
            value={form.bed_type}
            onChange={(e) => setForm((p) => ({ ...p, bed_type: e.target.value }))}
            placeholder="e.g. ICU-A"
          />
          <Input
            label="Ward"
            value={form.ward}
            onChange={(e) => setForm((p) => ({ ...p, ward: e.target.value }))}
            placeholder="e.g. ICU-A"
          />
          <Input
            label="Floor"
            value={form.floor}
            onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))}
            placeholder="e.g. 3rd"
          />
          <Input
            label="Equipment (comma-separated)"
            value={form.equipment_list}
            onChange={(e) => setForm((p) => ({ ...p, equipment_list: e.target.value }))}
            placeholder="Ventilator, ECG Monitor"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={createBed.isPending}>
              Add Bed
            </Button>
            <Button type="button" variant="outline" onClick={() => setAddModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Bed Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Bed">
        {editModal && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <p className="text-text-secondary">Bed: <strong>{editModal.bed_number}</strong></p>
            <Input
              label="Bed type"
              value={editModal.bed_type ?? ''}
              onChange={(e) => setEditModal((p) => ({ ...p, bed_type: e.target.value }))}
            />
            <Input
              label="Ward"
              value={editModal.ward ?? ''}
              onChange={(e) => setEditModal((p) => ({ ...p, ward: e.target.value }))}
            />
            <Input
              label="Floor"
              value={editModal.floor ?? ''}
              onChange={(e) => setEditModal((p) => ({ ...p, floor: e.target.value }))}
            />
            <Input
              label="Equipment (comma-separated)"
              value={Array.isArray(editModal.equipment_list) ? editModal.equipment_list.join(', ') : (editModal.equipment_list || '')}
              onChange={(e) => setEditModal((p) => ({ ...p, equipment_list: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={updateBed.isPending}>
                Save
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditModal(null)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Change Status Modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title="Change Bed Status">
        {statusModal && (
          <div className="space-y-4">
            <p className="text-text-secondary">Bed: <strong>{statusModal.bed_number}</strong></p>
            <div className="flex flex-wrap gap-2">
              {BED_STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={statusModal.status === opt.value ? 'primary' : 'outline'}
                  onClick={() => handleStatusChange(statusModal.id, opt.value)}
                  disabled={updateBed.isPending}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove ICU Bed">
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-text-secondary">
              Remove bed <strong>{deleteConfirm.bed_number}</strong>? This cannot be undone. Ensure no patient is assigned.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleDeleteConfirm} disabled={deleteBed.isPending}>
                Remove
              </Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
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
