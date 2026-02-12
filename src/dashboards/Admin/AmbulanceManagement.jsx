/**
 * Admin – Ambulance Management. CRUD ambulances, view and assign ambulance requests.
 */
import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select } from '../../components/common';
import {
  useAdminAmbulances,
  useAdminAmbulanceRequests,
  useAdminAmbulanceDrivers,
  useCreateAmbulance,
  useUpdateAmbulance,
  useDeleteAmbulance,
  useAssignAmbulanceRequest,
} from '../../hooks/useAdminAmbulanceApi';
import { Plus } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'Available', label: 'Available' },
  { value: 'On Duty', label: 'On Duty' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Offline', label: 'Offline' },
];

const TYPE_OPTIONS = [
  { value: 'Basic', label: 'Basic' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'ICU', label: 'ICU' },
  { value: 'Emergency', label: 'Emergency' },
];

const initialForm = {
  vehicle_number: '',
  ambulance_type: 'Basic',
  equipment_details: '',
  status: 'Available',
  current_location: '',
  driver_id: '',
};

export default function AmbulanceManagement() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [createOpen, setCreateOpen] = useState(false);
  const [editAmbulance, setEditAmbulance] = useState(null);
  const [assignRequest, setAssignRequest] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [assignForm, setAssignForm] = useState({ ambulance_id: '', assigned_driver_id: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: ambulances = [], isLoading: ambulancesLoading } = useAdminAmbulances();
  const { data: requests = [], isLoading: requestsLoading } = useAdminAmbulanceRequests();
  const { data: drivers = [] } = useAdminAmbulanceDrivers();
  const createMutation = useCreateAmbulance();
  const updateMutation = useUpdateAmbulance();
  const deleteMutation = useDeleteAmbulance();
  const assignMutation = useAssignAmbulanceRequest();

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show]);

  useEffect(() => {
    if (editAmbulance) {
      setForm({
        vehicle_number: editAmbulance.vehicle_number || '',
        ambulance_type: editAmbulance.ambulance_type || 'Basic',
        equipment_details: editAmbulance.equipment_details || '',
        status: editAmbulance.status || 'Available',
        current_location: editAmbulance.current_location || '',
        driver_id: editAmbulance.driver_id || '',
      });
    } else {
      setForm(initialForm);
    }
  }, [editAmbulance]);

  useEffect(() => {
    if (assignRequest) setAssignForm({ ambulance_id: '', assigned_driver_id: '' });
  }, [assignRequest]);

  const driverOptions = [{ value: '', label: 'No driver' }, ...drivers.map((d) => ({ value: d.id, label: `${d.full_name || d.email}` }))];
  const ambulanceOptions = [{ value: '', label: 'Select ambulance' }, ...ambulances.filter((a) => a.status === 'Available').map((a) => ({ value: a.id, label: `${a.vehicle_number} (${a.ambulance_type})` }))];

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.vehicle_number?.trim()) {
      setToast({ show: true, message: 'Vehicle number required', type: 'error' });
      return;
    }
    createMutation.mutate(
      {
        vehicle_number: form.vehicle_number.trim(),
        ambulance_type: form.ambulance_type,
        equipment_details: form.equipment_details?.trim() || null,
        status: form.status,
        current_location: form.current_location?.trim() || null,
        driver_id: form.driver_id || null,
      },
      {
        onSuccess: () => {
          setToast({ show: true, message: 'Ambulance added' });
          setCreateOpen(false);
          setForm(initialForm);
        },
        onError: (err) => setToast({ show: true, message: err.message || 'Failed', type: 'error' }),
      }
    );
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editAmbulance) return;
    updateMutation.mutate(
      {
        id: editAmbulance.id,
        body: {
          vehicle_number: form.vehicle_number.trim(),
          ambulance_type: form.ambulance_type,
          equipment_details: form.equipment_details?.trim() || null,
          status: form.status,
          current_location: form.current_location?.trim() || null,
          driver_id: form.driver_id || null,
        },
      },
      {
        onSuccess: () => {
          setToast({ show: true, message: 'Ambulance updated' });
          setEditAmbulance(null);
        },
        onError: (err) => setToast({ show: true, message: err.message || 'Failed', type: 'error' }),
      }
    );
  };

  const handleDelete = (amb) => {
    deleteMutation.mutate(amb.id, {
      onSuccess: () => {
        setToast({ show: true, message: 'Ambulance deleted' });
        setDeleteConfirm(null);
      },
      onError: (err) => setToast({ show: true, message: err.message || 'Failed', type: 'error' }),
    });
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignRequest) return;
    if (!assignForm.ambulance_id && !assignForm.assigned_driver_id) {
      setToast({ show: true, message: 'Select ambulance or driver', type: 'error' });
      return;
    }
    assignMutation.mutate(
      {
        id: assignRequest.id,
        ambulance_id: assignForm.ambulance_id || undefined,
        assigned_driver_id: assignForm.assigned_driver_id || undefined,
      },
      {
        onSuccess: () => {
          setToast({ show: true, message: 'Request assigned' });
          setAssignRequest(null);
        },
        onError: (err) => setToast({ show: true, message: err.message || 'Failed', type: 'error' }),
      }
    );
  };

  const driverName = (id) => drivers.find((d) => d.id === id)?.full_name || id?.slice(0, 8) || '–';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Ambulance Management</h1>

      <Card hover={false}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Ambulances</h2>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ambulance
          </Button>
        </div>
        {ambulancesLoading ? (
          <p className="text-text-muted py-4">Loading…</p>
        ) : ambulances.length === 0 ? (
          <p className="text-text-muted py-4">No ambulances. Add one to get started.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-text-secondary">Vehicle</th>
                  <th className="text-left py-2 font-medium text-text-secondary">Type</th>
                  <th className="text-left py-2 font-medium text-text-secondary">Status</th>
                  <th className="text-left py-2 font-medium text-text-secondary">Location</th>
                  <th className="text-left py-2 font-medium text-text-secondary">Driver</th>
                  <th className="text-right py-2 font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ambulances.map((a) => (
                  <tr key={a.id} className="border-b border-border-light">
                    <td className="py-3 text-text-primary font-medium">{a.vehicle_number}</td>
                    <td className="py-3 text-text-secondary">{a.ambulance_type}</td>
                    <td className="py-3"><Badge variant={a.status === 'Available' ? 'success' : a.status === 'On Duty' ? 'primary' : 'default'}>{a.status}</Badge></td>
                    <td className="py-3 text-text-secondary">{a.current_location || '–'}</td>
                    <td className="py-3 text-text-secondary">{driverName(a.driver_id)}</td>
                    <td className="py-3 text-right">
                      <Button variant="outline" className="mr-2" onClick={() => setEditAmbulance(a)}>Edit</Button>
                      <Button variant="outline" className="text-error" onClick={() => setDeleteConfirm(a)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card hover={false}>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Ambulance Requests</h2>
        {requestsLoading ? (
          <p className="text-text-muted py-4">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-text-muted py-4">No requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-text-secondary">From → To</th>
                  <th className="text-left py-2 font-medium text-text-secondary">Priority</th>
                  <th className="text-left py-2 font-medium text-text-secondary">Status</th>
                  <th className="text-right py-2 font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-border-light">
                    <td className="py-3 text-text-primary">{r.from_address} → {r.to_address}</td>
                    <td className="py-3"><Badge variant={r.priority === 'High' ? 'error' : 'warning'}>{r.priority}</Badge></td>
                    <td className="py-3"><Badge variant={r.status === 'pending' ? 'warning' : r.status === 'assigned' || r.status === 'en_route' ? 'primary' : 'success'}>{r.status}</Badge></td>
                    <td className="py-3 text-right">
                      {r.status === 'pending' && (
                        <Button variant="primary" onClick={() => setAssignRequest(r)}>Assign</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Ambulance">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Vehicle Number" value={form.vehicle_number} onChange={(e) => setForm((f) => ({ ...f, vehicle_number: e.target.value }))} placeholder="e.g. AMB-001" required />
          <Select label="Type" options={TYPE_OPTIONS} value={form.ambulance_type} onChange={(e) => setForm((f) => ({ ...f, ambulance_type: e.target.value }))} />
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} />
          <Input label="Current Location" value={form.current_location} onChange={(e) => setForm((f) => ({ ...f, current_location: e.target.value }))} placeholder="Optional" />
          <Select label="Driver" options={driverOptions} value={form.driver_id} onChange={(e) => setForm((f) => ({ ...f, driver_id: e.target.value }))} />
          <Input label="Equipment (optional)" value={form.equipment_details} onChange={(e) => setForm((f) => ({ ...f, equipment_details: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending}>Add</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editAmbulance} onClose={() => setEditAmbulance(null)} title="Edit Ambulance">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label="Vehicle Number" value={form.vehicle_number} onChange={(e) => setForm((f) => ({ ...f, vehicle_number: e.target.value }))} required />
          <Select label="Type" options={TYPE_OPTIONS} value={form.ambulance_type} onChange={(e) => setForm((f) => ({ ...f, ambulance_type: e.target.value }))} />
          <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} />
          <Input label="Current Location" value={form.current_location} onChange={(e) => setForm((f) => ({ ...f, current_location: e.target.value }))} />
          <Select label="Driver" options={driverOptions} value={form.driver_id} onChange={(e) => setForm((f) => ({ ...f, driver_id: e.target.value }))} />
          <Input label="Equipment (optional)" value={form.equipment_details} onChange={(e) => setForm((f) => ({ ...f, equipment_details: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditAmbulance(null)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={updateMutation.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!assignRequest} onClose={() => setAssignRequest(null)} title="Assign Ambulance to Request">
        {assignRequest && (
          <form onSubmit={handleAssign} className="space-y-4">
            <p className="text-sm text-text-secondary">{assignRequest.from_address} → {assignRequest.to_address} ({assignRequest.priority})</p>
            <Select label="Ambulance" options={ambulanceOptions} value={assignForm.ambulance_id} onChange={(e) => setAssignForm((f) => ({ ...f, ambulance_id: e.target.value }))} />
            <Select label="Driver" options={driverOptions} value={assignForm.assigned_driver_id} onChange={(e) => setAssignForm((f) => ({ ...f, assigned_driver_id: e.target.value }))} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAssignRequest(null)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={assignMutation.isPending}>Assign</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Ambulance">
        {deleteConfirm && (
          <>
            <p className="text-text-secondary">Delete {deleteConfirm.vehicle_number}? This cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)} disabled={deleteMutation.isPending}>Delete</Button>
            </div>
          </>
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
