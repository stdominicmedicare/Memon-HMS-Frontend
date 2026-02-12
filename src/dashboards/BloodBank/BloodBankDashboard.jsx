/**
 * Blood Bank Management Dashboard – KPIs, tabs: Blood Inventory, Donations & Testing, Blood Requests, Donor Management.
 */
import { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Select,
} from '../../components/common';
import {
  useBloodBankDashboard,
  useBloodBankDonors,
  useBloodBankCreateDonor,
  useBloodBankInventory,
  useBloodBankUnitsUnderTesting,
  useBloodBankApproveUnit,
  useBloodBankRejectUnit,
  useBloodBankRequests,
  useBloodBankApproveRequest,
  useBloodBankRejectRequest,
  useBloodBankAllocateRequest,
  useBloodBankCreateUnit,
} from '../../hooks/useBloodBankApi';
import {
  Droplets,
  AlertTriangle,
  HeartHandshake,
  FileText,
  Users,
  Search,
  Pencil,
  Check,
  X,
  Plus,
} from 'lucide-react';

const TAB_INVENTORY = 'inventory';
const TAB_DONATIONS = 'donations';
const TAB_REQUESTS = 'requests';
const TAB_DONORS = 'donors';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const COMPONENT_TYPES = [
  { value: 'whole_blood', label: 'Whole Blood' },
  { value: 'plasma', label: 'Plasma' },
  { value: 'platelets', label: 'Platelets' },
  { value: 'rbc', label: 'RBC' },
];

function StatCard({ icon: Icon, label, value, borderColor, iconBg }) {
  return (
    <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4" hover={false} style={{ borderLeft: `4px solid ${borderColor}` }}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card text-white" style={{ backgroundColor: iconBg }}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className="text-xl font-bold text-text-primary">{value}</p>
      </div>
    </Card>
  );
}

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function BloodBankDashboard() {
  const [activeTab, setActiveTab] = useState(TAB_INVENTORY);
  const [donorSearch, setDonorSearch] = useState('');
  const [addDonorOpen, setAddDonorOpen] = useState(false);
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [updateGroup, setUpdateGroup] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectRequestId, setRejectRequestId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const { data: dashboardData, isLoading: dashboardLoading } = useBloodBankDashboard();
  const { data: donors = [], isLoading: donorsLoading } = useBloodBankDonors(donorSearch);
  const { data: inventory = [], isLoading: inventoryLoading } = useBloodBankInventory();
  const { data: testingList = [], isLoading: testingLoading } = useBloodBankUnitsUnderTesting();
  const { data: requests = [], isLoading: requestsLoading } = useBloodBankRequests('');

  const createDonor = useBloodBankCreateDonor();
  const createUnit = useBloodBankCreateUnit();
  const approveUnit = useBloodBankApproveUnit();
  const rejectUnit = useBloodBankRejectUnit();
  const approveRequest = useBloodBankApproveRequest();
  const rejectRequest = useBloodBankRejectRequest();
  const allocateRequest = useBloodBankAllocateRequest();

  const kpis = dashboardData || {};
  const pendingTests = kpis.pendingTestsCount ?? 0;
  const pendingRequestsCount = kpis.pendingRequestsCount ?? 0;
  const pendingList = requests.filter((r) => r.request_status === 'pending');

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });
  const onError = (e) => showToast(e?.message || 'Failed', 'error');

  const [donorForm, setDonorForm] = useState({
    full_name: '',
    blood_group: 'O+',
    contact_phone: '',
    contact_email: '',
    medical_screening_notes: '',
    total_donations: 0,
  });
  const [unitForm, setUnitForm] = useState({
    donor_id: '',
    blood_group: 'O+',
    component_type: 'whole_blood',
    collection_date: new Date().toISOString().slice(0, 10),
    storage_location: '',
  });

  const handleAddDonor = (e) => {
    e.preventDefault();
    createDonor.mutate(donorForm, {
      onSuccess: () => {
        showToast('Donor added');
        setAddDonorOpen(false);
        setDonorForm({ full_name: '', blood_group: 'O+', contact_phone: '', contact_email: '', medical_screening_notes: '', total_donations: 0 });
      },
      onError,
    });
  };

  const handleAddUnit = (e) => {
    e.preventDefault();
    const payload = {
      ...unitForm,
      donor_id: unitForm.donor_id || undefined,
    };
    createUnit.mutate(payload, {
      onSuccess: () => {
        showToast('Blood unit added and sent for testing');
        setAddUnitOpen(false);
        setUpdateGroup(null);
        setUnitForm({ donor_id: '', blood_group: 'O+', component_type: 'whole_blood', collection_date: new Date().toISOString().slice(0, 10), storage_location: '' });
      },
      onError,
    });
  };

  const openUpdateStock = (group) => {
    setUpdateGroup(group);
    setUnitForm((f) => ({ ...f, blood_group: group }));
    setAddUnitOpen(true);
  };

  const handleRejectRequest = () => {
    if (!rejectRequestId) return;
    rejectRequest.mutate({ id: rejectRequestId, rejection_reason: rejectReason }, {
      onSuccess: () => {
        showToast('Request rejected');
        setRejectRequestId(null);
        setRejectReason('');
      },
      onError,
    });
  };

  const tabs = [
    { id: TAB_INVENTORY, label: 'Blood Inventory', icon: Droplets },
    { id: TAB_DONATIONS, label: 'Donations & Testing', icon: HeartHandshake, badge: pendingTests },
    { id: TAB_REQUESTS, label: 'Blood Requests', icon: FileText, badge: pendingRequestsCount },
    { id: TAB_DONORS, label: 'Donor Management', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Blood Bank Management Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Droplets}
          label="Total Blood Units"
          value={dashboardLoading ? '…' : (kpis.totalBloodUnits ?? 0)}
          borderColor="#dc2626"
          iconBg="#dc2626"
        />
        <StatCard
          icon={AlertTriangle}
          label="Critical Stock"
          value={dashboardLoading ? '…' : (kpis.criticalStock ?? 0)}
          borderColor="#ea580c"
          iconBg="#ea580c"
        />
        <StatCard
          icon={HeartHandshake}
          label="Pending Tests"
          value={dashboardLoading ? '…' : pendingTests}
          borderColor="#16a34a"
          iconBg="#16a34a"
        />
        <StatCard
          icon={FileText}
          label="Pending Requests"
          value={dashboardLoading ? '…' : pendingRequestsCount}
          borderColor="#2563eb"
          iconBg="#2563eb"
        />
      </div>

      <div className="border-b border-border">
        <nav className="flex flex-wrap gap-1" aria-label="Blood bank sections">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {badge != null && badge > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{badge}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Blood Inventory */}
      {activeTab === TAB_INVENTORY && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-text-primary">Blood Inventory Management</h2>
            <span className="text-sm text-text-muted">Last updated: {formatDate(new Date().toISOString())}</span>
          </div>
          {inventoryLoading ? (
            <Card><p className="text-text-muted py-4">Loading…</p></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {inventory.map((row) => (
                <Card key={row.blood_group} className="relative" hover={false}>
                  <div className="flex items-start justify-between gap-2">
                    <Droplets
                      className="h-8 w-8 shrink-0"
                      style={{
                        color: row.status === 'Critical' ? '#dc2626' : row.status === 'Low' ? '#ca8a04' : row.status === 'Adequate' ? '#2563eb' : '#16a34a',
                      }}
                    />
                    <Badge
                      variant={row.status === 'Critical' ? 'error' : row.status === 'Low' ? 'warning' : row.status === 'Adequate' ? 'info' : 'success'}
                    >
                      {row.status}
                    </Badge>
                  </div>
                  <p className="mt-2 font-semibold text-text-primary">{row.blood_group}</p>
                  <p className="text-sm text-text-secondary">{row.unitsAvailable} Units Available</p>
                  <button
                    type="button"
                    onClick={() => openUpdateStock(row.blood_group)}
                    className="mt-3 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <Pencil className="h-4 w-4" />
                    Update Stock
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Donations & Testing */}
      {activeTab === TAB_DONATIONS && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Donations &amp; Testing</h2>
          {testingLoading ? (
            <Card><p className="text-text-muted py-4">Loading…</p></Card>
          ) : testingList.length === 0 ? (
            <Card><p className="text-text-muted py-8 text-center">No units under testing.</p></Card>
          ) : (
            <div className="space-y-3">
              {testingList.map((u) => (
                <Card key={u.id} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-text-primary">Unit {u.id.slice(0, 8)}… · {u.blood_group}</p>
                    <p className="text-sm text-text-secondary">
                      {u.component_type} · Collected {formatDate(u.collection_date)} · Expiry {formatDate(u.expiry_date)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => approveUnit.mutate(u.id, { onSuccess: () => showToast('Unit approved'), onError })}
                      disabled={approveUnit.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => rejectUnit.mutate(u.id, { onSuccess: () => showToast('Unit rejected'), onError })}
                      disabled={rejectUnit.isPending}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blood Requests */}
      {activeTab === TAB_REQUESTS && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text-primary">Blood Transfusion Requests</h2>
          {requestsLoading ? (
            <Card><p className="text-text-muted py-4">Loading…</p></Card>
          ) : requests.length === 0 ? (
            <Card><p className="text-text-muted py-8 text-center">No requests.</p></Card>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <Card key={r.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-text-primary">
                        {r.patient?.full_name ?? 'Unknown'} <span className="text-text-muted font-normal">ID: {r.patient_id?.slice(0, 8)}…</span>
                      </p>
                      <p className="text-sm text-text-secondary">
                        {r.blood_group_required} · {r.units_required} Unit(s) · {formatDate(r.requested_at)}
                      </p>
                      <p className="text-sm text-text-secondary">Requested by: {r.doctor?.full_name ?? '—'}</p>
                      {r.medical_reason && (
                        <div className="mt-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2 text-sm text-text-primary">
                          {r.medical_reason}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={r.urgency_level === 'emergency' ? 'error' : 'info'}>{r.urgency_level}</Badge>
                      <Badge variant={r.request_status === 'pending' ? 'warning' : r.request_status === 'approved' || r.request_status === 'fulfilled' ? 'success' : 'secondary'}>
                        {r.request_status}
                      </Badge>
                    </div>
                  </div>
                  {(r.request_status === 'pending' || r.request_status === 'approved') && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {r.request_status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => approveRequest.mutate(r.id, { onSuccess: () => showToast('Request approved'), onError })}
                            disabled={approveRequest.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" /> Approve Request
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setRejectRequestId(r.id)}
                            disabled={rejectRequest.isPending}
                          >
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {r.request_status === 'approved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => allocateRequest.mutate(r.id, { onSuccess: () => showToast('Units allocated'), onError })}
                          disabled={allocateRequest.isPending}
                        >
                          Allocate units
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Donor Management */}
      {activeTab === TAB_DONORS && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-text-primary">Donor Management</h2>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search donors..."
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                  className="w-48 rounded-button border border-border bg-surface pl-9 pr-3 py-2 text-sm"
                />
              </div>
              <Button variant="primary" onClick={() => setAddDonorOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add Donor
              </Button>
            </div>
          </div>
          {donorsLoading ? (
            <Card><p className="text-text-muted py-4">Loading…</p></Card>
          ) : (
            <Card padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-text-primary">DONOR</th>
                      <th className="px-4 py-3 font-medium text-text-primary">BLOOD TYPE</th>
                      <th className="px-4 py-3 font-medium text-text-primary">CONTACT</th>
                      <th className="px-4 py-3 font-medium text-text-primary">LAST DONATION</th>
                      <th className="px-4 py-3 font-medium text-text-primary">TOTAL DONATIONS</th>
                      <th className="px-4 py-3 font-medium text-text-primary">ELIGIBLE DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted">No donors found.</td></tr>
                    ) : (
                      donors.map((d) => (
                        <tr key={d.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">
                            <span className="font-medium text-text-primary">{d.full_name}</span>
                            {d.donor_code && <span className="ml-1 text-text-muted">ID: {d.donor_code}</span>}
                          </td>
                          <td className="px-4 py-3"><Badge variant="info">{d.blood_group}</Badge></td>
                          <td className="px-4 py-3 text-text-secondary">{d.contact_phone || '–'} {d.contact_email || ''}</td>
                          <td className="px-4 py-3 text-text-secondary">{formatDate(d.last_donation_date) || '–'}</td>
                          <td className="px-4 py-3 text-text-secondary">{d.total_donations ?? 0}</td>
                          <td className="px-4 py-3">
                            {d.eligible_date ? (
                              new Date(d.eligible_date) <= new Date() ? (
                                <span className="text-green-600 font-medium">Eligible now</span>
                              ) : (
                                formatDate(d.eligible_date)
                              )
                            ) : '–'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Add Donor Modal */}
      <Modal open={addDonorOpen} onClose={() => setAddDonorOpen(false)} title="Add Donor">
        <form onSubmit={handleAddDonor} className="space-y-4">
          <Input
            label="Full name"
            value={donorForm.full_name}
            onChange={(e) => setDonorForm((f) => ({ ...f, full_name: e.target.value }))}
            required
          />
          <Select
            label="Blood group"
            value={donorForm.blood_group}
            onChange={(e) => setDonorForm((f) => ({ ...f, blood_group: e.target.value }))}
            options={BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg }))}
          />
          <Input
            label="Contact phone"
            value={donorForm.contact_phone}
            onChange={(e) => setDonorForm((f) => ({ ...f, contact_phone: e.target.value }))}
          />
          <Input
            label="Contact email"
            type="email"
            value={donorForm.contact_email}
            onChange={(e) => setDonorForm((f) => ({ ...f, contact_email: e.target.value }))}
          />
          <Input
            label="Medical screening notes"
            value={donorForm.medical_screening_notes}
            onChange={(e) => setDonorForm((f) => ({ ...f, medical_screening_notes: e.target.value }))}
          />
          <Input
            label="Total donations"
            type="number"
            min={0}
            value={donorForm.total_donations}
            onChange={(e) => setDonorForm((f) => ({ ...f, total_donations: parseInt(e.target.value, 10) || 0 }))}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAddDonorOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={createDonor.isPending}>Add Donor</Button>
          </div>
        </form>
      </Modal>

      {/* Add Unit (Update Stock) Modal */}
      <Modal open={addUnitOpen} onClose={() => { setAddUnitOpen(false); setUpdateGroup(null); }} title={updateGroup ? `Add unit – ${updateGroup}` : 'Add blood unit'}>
        <form onSubmit={handleAddUnit} className="space-y-4">
          <Select
            label="Blood group"
            value={unitForm.blood_group}
            onChange={(e) => setUnitForm((f) => ({ ...f, blood_group: e.target.value }))}
            options={BLOOD_GROUPS.map((bg) => ({ value: bg, label: bg }))}
          />
          <Select
            label="Component type"
            value={unitForm.component_type}
            onChange={(e) => setUnitForm((f) => ({ ...f, component_type: e.target.value }))}
            options={COMPONENT_TYPES}
          />
          <Input
            label="Collection date"
            type="date"
            value={unitForm.collection_date}
            onChange={(e) => setUnitForm((f) => ({ ...f, collection_date: e.target.value }))}
          />
          <Input
            label="Storage location"
            value={unitForm.storage_location}
            onChange={(e) => setUnitForm((f) => ({ ...f, storage_location: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setAddUnitOpen(false); setUpdateGroup(null); }}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={createUnit.isPending}>Add unit</Button>
          </div>
        </form>
      </Modal>

      {/* Reject request reason modal */}
      <Modal open={!!rejectRequestId} onClose={() => { setRejectRequestId(null); setRejectReason(''); }} title="Reject request">
        <div className="space-y-4">
          <Input
            label="Rejection reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Insufficient stock"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setRejectRequestId(null); setRejectReason(''); }}>Cancel</Button>
            <Button type="button" variant="primary" onClick={handleRejectRequest} disabled={rejectRequest.isPending}>Reject</Button>
          </div>
        </div>
      </Modal>

      {toast.show && (
        <div
          className={`fixed bottom-4 right-4 rounded-lg px-4 py-2 shadow-lg ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
