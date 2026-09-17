/**
 * Pharmacy Management Panel – KPIs, tabs: Medicine Inventory, Prescriptions, Procurement, Expiry Monitor.
 * Matches provided design: summary cards, search/filter, Add Medicine, table, pending prescriptions, POs, expiry list.
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
  usePharmacyDashboard,
  usePharmacyMedicines,
  usePharmacyCreateMedicine,
  usePharmacyUpdateMedicine,
  usePharmacyDeleteMedicine,
  usePharmacyPendingPrescriptions,
  usePharmacyDispensePrescription,
  usePharmacyRejectPrescription,
  usePharmacyExpiryList,
  usePharmacyPurchaseOrders,
  usePharmacyCreatePurchaseOrder,
  usePharmacyUpdatePurchaseOrder,
} from '../../hooks/usePharmacyApi';
import {
  Pill,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  ShoppingCart,
  Search,
  Pencil,
  Check,
  X,
} from 'lucide-react';

const TAB_INVENTORY = 'inventory';
const TAB_PRESCRIPTIONS = 'prescriptions';
const TAB_PROCUREMENT = 'procurement';
const TAB_EXPIRY = 'expiry';

const UNITS = ['Tablets', 'Capsules', 'Vials', 'Bottles', 'Tubes', 'Units'];
const CATEGORIES = ['General', 'Analgesics', 'Antibiotics', 'Anti-inflammatory', 'Diabetes', 'Gastrointestinal', 'Cardiovascular'];

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

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

export default function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState(TAB_INVENTORY);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [addMedicineOpen, setAddMedicineOpen] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    manufacturer: '',
    category: 'General',
    stock_quantity: 0,
    unit: 'Tablets',
    storage_conditions: 'Room Temperature',
    expiry_date: '',
    price_per_unit: 0,
    low_stock_threshold: 10,
  });
  const [poForm, setPoForm] = useState({ supplier_name: '', order_date: new Date().toISOString().slice(0, 10), expected_delivery: '', items: [{ medicine_id: '', medicine_name: '', quantity: 1, unit_price: 0 }] });

  const { data: dashboardData, isLoading: dashboardLoading } = usePharmacyDashboard();
  const { data: medicines = [], isLoading: medicinesLoading } = usePharmacyMedicines(search, categoryFilter === 'All' ? '' : categoryFilter);
  const { data: pendingRx = [] } = usePharmacyPendingPrescriptions();
  const { data: expiryList = [] } = usePharmacyExpiryList();
  const { data: purchaseOrders = [] } = usePharmacyPurchaseOrders();

  const createMedicine = usePharmacyCreateMedicine();
  const updateMedicine = usePharmacyUpdateMedicine();
  const deleteMedicine = usePharmacyDeleteMedicine();
  const dispenseRx = usePharmacyDispensePrescription();
  const rejectRx = usePharmacyRejectPrescription();
  const createPO = usePharmacyCreatePurchaseOrder();
  const updatePO = usePharmacyUpdatePurchaseOrder();

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });
  const onError = (e) => showToast(e?.message || 'Failed', 'error');

  const kpis = dashboardData || {};
  const pendingCount = kpis.pendingPrescriptionsCount ?? pendingRx.length;

  const handleAddMedicine = (e) => {
    e.preventDefault();
    createMedicine.mutate(medicineForm, {
      onSuccess: () => {
        showToast('Medicine added');
        setAddMedicineOpen(false);
        setMedicineForm({ name: '', manufacturer: '', category: 'General', stock_quantity: 0, unit: 'Tablets', storage_conditions: 'Room Temperature', expiry_date: '', price_per_unit: 0, low_stock_threshold: 10 });
      },
      onError,
    });
  };

  const handleUpdateMedicine = (e) => {
    e.preventDefault();
    if (!editMedicine) return;
    updateMedicine.mutate({ id: editMedicine.id, ...medicineForm }, {
      onSuccess: () => { showToast('Medicine updated'); setEditMedicine(null); },
      onError,
    });
  };

  const handleDispense = (id) => {
    dispenseRx.mutate(id, { onSuccess: () => showToast('Medicines dispensed'), onError });
  };

  const handleReject = (id) => {
    rejectRx.mutate(id, { onSuccess: () => showToast('Prescription rejected'), onError });
  };

  const handleCreatePO = (e) => {
    e.preventDefault();
    const items = poForm.items.filter((i) => i.medicine_id || i.medicine_name).map((i) => ({
      medicine_id: i.medicine_id || null,
      medicine_name: i.medicine_name || 'Item',
      quantity: parseInt(i.quantity, 10) || 1,
      unit_price: parseFloat(i.unit_price) || 0,
    }));
    if (items.length === 0) { showToast('Add at least one item', 'error'); return; }
    createPO.mutate(
      { supplier_name: poForm.supplier_name, order_date: poForm.order_date, expected_delivery: poForm.expected_delivery || null, items },
      {
        onSuccess: () => {
          showToast('Purchase order created');
          setCreatePOOpen(false);
          setPoForm({ supplier_name: '', order_date: new Date().toISOString().slice(0, 10), expected_delivery: '', items: [{ medicine_id: '', medicine_name: '', quantity: 1, unit_price: 0 }] });
        },
        onError,
      }
    );
  };

  const tabs = [
    { id: TAB_INVENTORY, label: 'Medicine Inventory', icon: Pill },
    { id: TAB_PRESCRIPTIONS, label: 'Prescriptions', icon: FileText, badge: pendingCount },
    { id: TAB_PROCUREMENT, label: 'Procurement', icon: ShoppingCart },
    { id: TAB_EXPIRY, label: 'Expiry Monitor', icon: Calendar },
  ];

  if (dashboardLoading && !dashboardData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Pharmacy Management Panel</h1>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Pill} label="Total Medicines" value={kpis.totalMedicines ?? 0} borderColor="#3b82f6" iconBg="#3b82f6" />
        <StatCard icon={AlertTriangle} label="Low Stock Alerts" value={kpis.lowStockAlerts ?? 0} borderColor="#f59e0b" iconBg="#f59e0b" />
        <StatCard icon={Calendar} label="Expiring Soon" value={kpis.expiringSoon ?? 0} borderColor="#ef4444" iconBg="#ef4444" />
        <StatCard icon={DollarSign} label="Inventory Value" value={`$${kpis.inventoryValue ?? 0}`} borderColor="#22c55e" iconBg="#22c55e" />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-2 overflow-x-auto sm:gap-4" aria-label="Pharmacy sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors touch-manipulation ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="rounded-full bg-error px-2 py-0.5 text-xs text-white">{tab.badge}</span>
            )}
          </button>
        ))}
        </nav>
      </div>

      {/* Medicine Inventory */}
      {activeTab === TAB_INVENTORY && (
        <Card hover={false}>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-text-primary">Medicine Inventory Management</h2>
            <Button variant="primary" onClick={() => setAddMedicineOpen(true)}>
              + Add Medicine
            </Button>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative w-full min-w-0 flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-input border border-border py-2 pl-9 pr-3 text-text-primary focus:border-primary focus:outline-none"
              />
            </div>
            <Select
              options={[{ value: 'All', label: 'All' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-40"
            />
          </div>
          {medicinesLoading ? (
            <p className="py-6 text-text-muted">Loading...</p>
          ) : medicines.length === 0 ? (
            <p className="py-6 text-text-muted">No medicines. Add one to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary">
                    <th className="pb-2 pr-4 font-medium">MEDICINE</th>
                    <th className="pb-2 pr-4 font-medium">CATEGORY</th>
                    <th className="pb-2 pr-4 font-medium">STOCK</th>
                    <th className="pb-2 pr-4 font-medium">STORAGE</th>
                    <th className="pb-2 pr-4 font-medium">EXPIRY DATE</th>
                    <th className="pb-2 pr-4 font-medium">PRICE</th>
                    <th className="pb-2 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((m) => (
                    <tr key={m.id} className="border-b border-border">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-text-primary">{m.name}</p>
                        {m.manufacturer && <p className="text-xs text-text-muted">{m.manufacturer}</p>}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="primary">{m.category}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-text-secondary">{m.stock_quantity} {m.unit}</td>
                      <td className="py-3 pr-4 text-text-secondary">{m.storage_conditions || '–'}</td>
                      <td className="py-3 pr-4 text-text-secondary">{formatDate(m.expiry_date)}</td>
                      <td className="py-3 pr-4 text-text-secondary">${parseFloat(m.price_per_unit || 0).toFixed(2)}</td>
                      <td className="py-3">
                        <Button variant="outline" className="!py-1.5 !px-2" onClick={() => { setEditMedicine(m); setMedicineForm({ name: m.name, manufacturer: m.manufacturer || '', category: m.category, stock_quantity: m.stock_quantity, unit: m.unit, storage_conditions: m.storage_conditions || '', expiry_date: m.expiry_date ? m.expiry_date.slice(0, 10) : '', price_per_unit: m.price_per_unit, low_stock_threshold: m.low_stock_threshold }); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Prescriptions */}
      {activeTab === TAB_PRESCRIPTIONS && (
        <Card hover={false}>
          <h2 className="mb-4 text-lg font-bold text-text-primary">Prescription Management</h2>
          {pendingRx.length === 0 ? (
            <p className="py-6 text-text-muted">No pending prescriptions.</p>
          ) : (
            <div className="space-y-4">
              {pendingRx.map((rx) => (
                <div key={rx.id} className="rounded-card border border-border bg-surface-muted/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text-primary">{rx.patient?.full_name || 'Patient'}</p>
                      <p className="text-sm text-text-muted">ID: {rx.patient_id?.slice(0, 8)}</p>
                      <p className="text-sm text-text-secondary">Prescribed by: Dr. {rx.doctor?.full_name || rx.doctor_id}</p>
                      <p className="text-sm text-text-muted">Date: {formatDate(rx.created_at)}</p>
                    </div>
                    <Badge variant="warning">Pending</Badge>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm font-medium text-text-secondary">Prescribed Medicines:</p>
                    <ul className="mt-1 space-y-1">
                      {(rx.items && rx.items.length > 0
                        ? rx.items
                        : [{ medication_text: rx.medication, dosage: rx.dosage, frequency: rx.frequency, quantity: rx.quantity || 1 }]
                      ).map((item, idx) => (
                        <li key={idx} className="flex justify-between text-sm">
                          <span>{item.medication_text || item.medication} {item.dosage && `– ${item.dosage}`} {item.frequency && `, ${item.frequency}`}</span>
                          <span className="font-medium">Qty: {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {rx.special_instructions && (
                    <div className="mt-2 rounded bg-blue-50 p-2 text-sm text-text-secondary">
                      {rx.special_instructions}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button variant="primary" onClick={() => handleDispense(rx.id)} disabled={dispenseRx.isPending}>
                      <Check className="h-4 w-4" /> Dispense Medicines
                    </Button>
                    <Button variant="outline" onClick={() => handleReject(rx.id)} disabled={rejectRx.isPending}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Procurement */}
      {activeTab === TAB_PROCUREMENT && (
        <Card hover={false}>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-text-primary">Procurement Management</h2>
            <Button variant="primary" onClick={() => setCreatePOOpen(true)}>
              + Create Purchase Order
            </Button>
          </div>
          {purchaseOrders.length === 0 ? (
            <p className="py-6 text-text-muted">No purchase orders yet.</p>
          ) : (
            <div className="space-y-4">
              {purchaseOrders.map((po) => (
                <div key={po.id} className="rounded-card border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text-primary">Order #{po.order_number}</p>
                      <p className="text-sm text-text-secondary">Supplier: {po.supplier_name}</p>
                      <p className="text-sm text-text-muted">Order Date: {formatDate(po.order_date)} · Expected: {formatDate(po.expected_delivery)}</p>
                    </div>
                    <Badge variant={po.status === 'received' ? 'success' : po.status === 'cancelled' ? 'default' : 'warning'}>{po.status}</Badge>
                  </div>
                  {po.items?.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-text-secondary">
                      {po.items.map((i) => (
                        <li key={i.id}>{i.medicine_name} – Qty: {i.quantity} – ${parseFloat(i.total_price || 0).toFixed(2)}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 font-medium text-text-primary">Total: ${parseFloat(po.total_amount || 0).toFixed(2)}</p>
                  {po.status === 'pending' && (
                    <Button variant="outline" className="mt-2" onClick={() => updatePO.mutate({ id: po.id, status: 'received' }, { onSuccess: () => showToast('Order marked received'), onError })}>
                      Mark Received
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Expiry Monitor */}
      {activeTab === TAB_EXPIRY && (
        <Card hover={false}>
          <h2 className="mb-4 text-lg font-bold text-text-primary">Expiry Date Monitoring</h2>
          {expiryList.length === 0 ? (
            <p className="py-6 text-text-muted">No medicines with expiry dates, or none expiring soon.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {expiryList.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-card border p-4 ${m.isExpired ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/30'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text-primary">{m.name}</p>
                      <p className="text-sm text-text-secondary">Category: {m.category}</p>
                      <p className="text-sm text-text-muted">Stock: {m.stock_quantity} {m.unit}</p>
                      <p className="text-sm text-text-muted">Expiry Date: {formatDate(m.expiry_date)}</p>
                    </div>
                    {m.isExpired && (
                      <Badge variant="error">EXPIRED</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add Medicine Modal */}
      <Modal open={addMedicineOpen} onClose={() => setAddMedicineOpen(false)} title="Add Medicine">
        <form onSubmit={handleAddMedicine} className="space-y-4">
          <Input label="Name" value={medicineForm.name} onChange={(e) => setMedicineForm((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="Manufacturer" value={medicineForm.manufacturer} onChange={(e) => setMedicineForm((p) => ({ ...p, manufacturer: e.target.value }))} />
          <Select label="Category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} value={medicineForm.category} onChange={(e) => setMedicineForm((p) => ({ ...p, category: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" label="Stock" value={medicineForm.stock_quantity} onChange={(e) => setMedicineForm((p) => ({ ...p, stock_quantity: e.target.value }))} min={0} />
            <Select label="Unit" options={UNITS.map((u) => ({ value: u, label: u }))} value={medicineForm.unit} onChange={(e) => setMedicineForm((p) => ({ ...p, unit: e.target.value }))} />
          </div>
          <Input label="Storage" value={medicineForm.storage_conditions} onChange={(e) => setMedicineForm((p) => ({ ...p, storage_conditions: e.target.value }))} />
          <Input type="date" label="Expiry date" value={medicineForm.expiry_date} onChange={(e) => setMedicineForm((p) => ({ ...p, expiry_date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" step="0.01" label="Price per unit" value={medicineForm.price_per_unit} onChange={(e) => setMedicineForm((p) => ({ ...p, price_per_unit: e.target.value }))} />
            <Input type="number" label="Low stock threshold" value={medicineForm.low_stock_threshold} onChange={(e) => setMedicineForm((p) => ({ ...p, low_stock_threshold: e.target.value }))} min={0} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={createMedicine.isPending}>Add</Button>
            <Button type="button" variant="outline" onClick={() => setAddMedicineOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Medicine Modal */}
      <Modal open={!!editMedicine} onClose={() => setEditMedicine(null)} title="Edit Medicine">
        {editMedicine && (
          <form onSubmit={handleUpdateMedicine} className="space-y-4">
            <Input label="Name" value={medicineForm.name} onChange={(e) => setMedicineForm((p) => ({ ...p, name: e.target.value }))} required />
            <Input label="Manufacturer" value={medicineForm.manufacturer} onChange={(e) => setMedicineForm((p) => ({ ...p, manufacturer: e.target.value }))} />
            <Select label="Category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} value={medicineForm.category} onChange={(e) => setMedicineForm((p) => ({ ...p, category: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" label="Stock" value={medicineForm.stock_quantity} onChange={(e) => setMedicineForm((p) => ({ ...p, stock_quantity: e.target.value }))} min={0} />
              <Select label="Unit" options={UNITS.map((u) => ({ value: u, label: u }))} value={medicineForm.unit} onChange={(e) => setMedicineForm((p) => ({ ...p, unit: e.target.value }))} />
            </div>
            <Input label="Storage" value={medicineForm.storage_conditions} onChange={(e) => setMedicineForm((p) => ({ ...p, storage_conditions: e.target.value }))} />
            <Input type="date" label="Expiry date" value={medicineForm.expiry_date} onChange={(e) => setMedicineForm((p) => ({ ...p, expiry_date: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" step="0.01" label="Price per unit" value={medicineForm.price_per_unit} onChange={(e) => setMedicineForm((p) => ({ ...p, price_per_unit: e.target.value }))} />
              <Input type="number" label="Low stock threshold" value={medicineForm.low_stock_threshold} onChange={(e) => setMedicineForm((p) => ({ ...p, low_stock_threshold: e.target.value }))} min={0} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={updateMedicine.isPending}>Save</Button>
              <Button type="button" variant="outline" onClick={() => setEditMedicine(null)}>Cancel</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create PO Modal */}
      <Modal open={createPOOpen} onClose={() => setCreatePOOpen(false)} title="Create Purchase Order">
        <form onSubmit={handleCreatePO} className="space-y-4">
          <Input label="Supplier name" value={poForm.supplier_name} onChange={(e) => setPoForm((p) => ({ ...p, supplier_name: e.target.value }))} required />
          <Input type="date" label="Order date" value={poForm.order_date} onChange={(e) => setPoForm((p) => ({ ...p, order_date: e.target.value }))} />
          <Input type="date" label="Expected delivery" value={poForm.expected_delivery} onChange={(e) => setPoForm((p) => ({ ...p, expected_delivery: e.target.value }))} />
          <p className="text-sm font-medium text-text-secondary">Items</p>
          {poForm.items.map((item, idx) => (
            <div key={idx} className="flex flex-wrap gap-2 rounded border border-border p-2">
              <Select
                options={[{ value: '', label: 'Select medicine' }, ...medicines.map((m) => ({ value: m.id, label: m.name }))]}
                value={item.medicine_id}
                onChange={(e) => {
                  const med = medicines.find((m) => m.id === e.target.value);
                  setPoForm((p) => ({
                    ...p,
                    items: p.items.map((it, i) => i === idx ? { ...it, medicine_id: e.target.value, medicine_name: med?.name || '', unit_price: med?.price_per_unit || 0 } : it),
                  }));
                }}
              />
              <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => setPoForm((p) => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, quantity: e.target.value } : it) }))} min={1} className="w-20" />
              <Input type="number" step="0.01" placeholder="Unit price" value={item.unit_price} onChange={(e) => setPoForm((p) => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, unit_price: e.target.value } : it) }))} className="w-24" />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => setPoForm((p) => ({ ...p, items: [...p.items, { medicine_id: '', medicine_name: '', quantity: 1, unit_price: 0 }] }))}>
            + Add item
          </Button>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={createPO.isPending}>Create Order</Button>
            <Button type="button" variant="outline" onClick={() => setCreatePOOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      {toast.show && (
        <div className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-button px-4 py-2 text-sm font-medium text-white ${toast.type === 'error' ? 'bg-error' : 'bg-primary'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
