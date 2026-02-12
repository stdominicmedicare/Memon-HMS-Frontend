/**
 * Admin – Role Assignment. Choose user and role; assign with one click.
 * Table of current assignments. Toast feedback. Responsive: cards on mobile, table on md+.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  Th,
  Td,
  Select,
  Toast,
} from '../../components/common';
import { apiGet, apiPatch } from '../../services/api';
import { ROLES, ROLE_LABELS } from '../../utils/constants';

const roleOptions = Object.values(ROLES).map((r) => ({ value: r, label: ROLE_LABELS[r] || r }));

function showToast(setToast, message, type = 'success') {
  setToast({ show: true, message, type });
}

export default function RoleAssignment() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const loadUsers = useCallback(() => {
    setLoading(true);
    apiGet('/api/admin/users')
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedRole) {
      showToast(setToast, 'Select a user and a role', 'error');
      return;
    }
    setAssigning(true);
    try {
      await apiPatch(`/api/admin/users/${selectedUserId}`, { role: selectedRole });
      showToast(setToast, 'Role assigned successfully');
      setSelectedUserId('');
      setSelectedRole('');
      loadUsers();
    } catch (err) {
      showToast(setToast, err.message || 'Assignment failed', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const userOptions = [
    { value: '', label: 'Select user' },
    ...users.map((u) => ({ value: u.id, label: `${u.full_name || u.email} (${u.email})` })),
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Role Assignment</h1>
        <p className="mt-0.5 text-sm text-text-secondary sm:mt-1">
          Assign roles to users. Choose from all available roles.
        </p>
      </div>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-text-primary sm:text-lg">Assign role to user</h2>
        <form onSubmit={handleAssign} className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:items-end lg:grid-cols-3">
          <div className="w-full sm:min-w-0">
            <Select
              label="User"
              options={userOptions}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            />
          </div>
          <div className="w-full sm:min-w-0">
            <Select
              label="Role"
              options={[{ value: '', label: 'Select role' }, ...roleOptions]}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            />
          </div>
          <div className="w-full sm:min-w-0">
            <Button type="submit" variant="primary" disabled={assigning} className="w-full sm:w-auto">
              {assigning ? 'Assigning…' : 'Assign'}
            </Button>
          </div>
        </form>
      </Card>

      <Card padding={false} hover={false}>
        <div className="border-b border-border p-4 md:p-5">
          <h2 className="text-base font-semibold text-text-primary sm:text-lg">Current assignments</h2>
        </div>
        {loading ? (
          <div className="p-4 text-text-muted md:p-5">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-text-muted md:p-5">No users yet.</div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="divide-y divide-border md:hidden">
              {users.map((u) => (
                <div key={u.id} className="flex flex-col gap-2 p-4">
                  <p className="font-medium text-text-primary">{u.full_name || '–'}</p>
                  <p className="truncate text-sm text-text-secondary">{u.email}</p>
                  <Badge variant="primary" className="w-fit">
                    {ROLE_LABELS[u.role] || u.role || '–'}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHead>
                  <Th>User</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <Td>{u.full_name || '–'}</Td>
                      <Td className="whitespace-nowrap">{u.email}</Td>
                      <Td>
                        <Badge variant="primary">{ROLE_LABELS[u.role] || u.role || '–'}</Badge>
                      </Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>

      <Toast message={toast.message} type={toast.type} visible={toast.show} />
    </div>
  );
}
