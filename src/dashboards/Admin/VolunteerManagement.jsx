/**
 * Admin – Volunteer Management. Create volunteer (name, email, phone, blood group), list, edit, deactivate.
 */
import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Select, Table, TableHead, TableBody, TableRow, Th, Td } from '../../components/common';
import { apiGet, apiPost, apiPatch } from '../../services/api';
import { BLOOD_GROUPS } from '../../utils/constants';
import { validatePassword, PASSWORD_HINT } from '../../utils/passwordPolicy';
import { UserPlus, Pencil, Droplets } from 'lucide-react';

const bloodGroupOptions = BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg }));

function showToast(setToast, message, type = 'success') {
  setToast({ show: true, message, type });
}

export default function VolunteerManagement() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editVolunteer, setEditVolunteer] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    blood_group: '',
  });
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', blood_group: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadVolunteers = () => {
    setLoading(true);
    apiGet('/api/admin/volunteers')
      .then((data) => setVolunteers(Array.isArray(data) ? data : []))
      .catch(() => setVolunteers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVolunteers();
  }, []);

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password || !createForm.blood_group) {
      showToast(setToast, 'Email, password, and blood group are required', 'error');
      return;
    }
    const check = validatePassword(createForm.password);
    if (!check.ok) {
      showToast(setToast, check.error, 'error');
      return;
    }
    setCreating(true);
    try {
      await apiPost('/api/admin/volunteers', createForm);
      showToast(setToast, 'Volunteer created successfully');
      setCreateOpen(false);
      setCreateForm({ email: '', password: '', full_name: '', phone: '', blood_group: '' });
      loadVolunteers();
    } catch (err) {
      showToast(setToast, err?.response?.data?.error || err?.message || 'Failed to create', 'error');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (v) => {
    setEditVolunteer(v);
    setEditForm({
      full_name: v.full_name ?? '',
      phone: v.phone ?? '',
      blood_group: v.blood_group ?? '',
      is_active: v.is_active !== false,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editVolunteer) return;
    setSaving(true);
    try {
      await apiPatch(`/api/admin/volunteers/${editVolunteer.id}`, editForm);
      showToast(setToast, 'Volunteer updated');
      setEditVolunteer(null);
      loadVolunteers();
    } catch (err) {
      showToast(setToast, err?.response?.data?.error || err?.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Volunteer Management</h1>
        <Button variant="primary" onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Create Volunteer
        </Button>
      </div>

      <Card hover={false}>
        <p className="mb-4 text-sm text-text-secondary">
          Volunteers are blood donors who can see and accept blood donation requests. Create accounts with name, email, phone, and blood group. They cannot access admin, ICU, ambulance, or patient records.
        </p>
        {loading ? (
          <p className="text-text-muted">Loading…</p>
        ) : volunteers.length === 0 ? (
          <p className="text-text-muted">No volunteers yet. Create one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Blood Group</Th>
                  <Th>Availability</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {volunteers.map((v) => (
                  <TableRow key={v.id}>
                    <Td className="font-medium text-text-primary">{v.full_name || '–'}</Td>
                    <Td className="text-text-secondary">{v.email || '–'}</Td>
                    <Td className="text-text-secondary">{v.phone || '–'}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 font-medium text-error">
                        <Droplets className="h-4 w-4" />
                        {v.blood_group || '–'}
                      </span>
                    </Td>
                    <Td>
                      {v.is_available ? (
                        <Badge variant="success">Available</Badge>
                      ) : (
                        <Badge variant="default">Unavailable</Badge>
                      )}
                    </Td>
                    <Td>
                      {v.is_active !== false ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Deactivated</Badge>
                      )}
                    </Td>
                    <Td className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(v)} className="inline-flex items-center gap-1">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Volunteer">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full name"
            value={createForm.full_name}
            onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Ahmed Khan"
          />
          <Input
            label="Email"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="ahmed@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Min 6 characters"
            required
          />
          <Input
            label="Phone"
            value={createForm.phone}
            onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Optional"
          />
          <Select
            label="Blood group"
            options={[{ value: '', label: 'Select blood group' }, ...bloodGroupOptions]}
            value={createForm.blood_group}
            onChange={(e) => setCreateForm((f) => ({ ...f, blood_group: e.target.value }))}
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create Volunteer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editVolunteer} onClose={() => setEditVolunteer(null)} title="Edit Volunteer">
        {editVolunteer && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Input
              label="Full name"
              value={editForm.full_name}
              onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
            />
            <Input
              label="Phone"
              value={editForm.phone}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Select
              label="Blood group"
              options={bloodGroupOptions}
              value={editForm.blood_group}
              onChange={(e) => setEditForm((f) => ({ ...f, blood_group: e.target.value }))}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.is_active}
                onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="rounded border-border"
              />
              <label htmlFor="edit-active" className="text-sm font-medium text-text-primary">Active (deactivate to disable login)</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditVolunteer(null)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
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
