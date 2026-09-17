/**
 * Admin / staff – Patient Records: search, register, timeline, merge, export.
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
  Modal,
  Input,
  Toast,
} from '../../components/common';
import { apiGet, apiPost, apiDownload } from '../../services/api';
import { Search, UserPlus, GitMerge, Download, RefreshCw } from 'lucide-react';

function showToast(setToast, message, type = 'success') {
  setToast({ show: true, message, type });
}

function formatWhen(v) {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

export default function PatientRecords() {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    date_of_birth: '',
    data_consent: false,
  });
  const [duplicates, setDuplicates] = useState([]);
  const [registering, setRegistering] = useState(false);

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeForm, setMergeForm] = useState({ survivor_id: '', duplicate_id: '', reason: '' });
  const [merging, setMerging] = useState(false);

  const search = useCallback(
    async (q = query) => {
      setLoading(true);
      try {
        const data = await apiGet(`/api/records/search?q=${encodeURIComponent(q || '')}&limit=50`);
        setPatients(Array.isArray(data) ? data : []);
      } catch (err) {
        setPatients([]);
        showToast(setToast, err.message || 'Search failed', 'error');
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  useEffect(() => {
    search('');
  }, []); // initial load

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3500);
    return () => clearTimeout(t);
  }, [toast.show]);

  const openPatient = async (p) => {
    setSelected(p);
    setTimelineLoading(true);
    setTimeline([]);
    try {
      const data = await apiGet(`/api/records/${p.id}/timeline`);
      setTimeline(data?.events || []);
      if (data?.patient) setSelected(data.patient);
    } catch (err) {
      showToast(setToast, err.message || 'Failed to load timeline', 'error');
    } finally {
      setTimelineLoading(false);
    }
  };

  const checkDupThenRegister = async (force = false) => {
    if (!regForm.data_consent) {
      showToast(setToast, 'Patient data-storage consent is required', 'error');
      return;
    }
    setRegistering(true);
    try {
      if (!force) {
        const dup = await apiPost('/api/records/check-duplicates', {
          full_name: regForm.full_name,
          phone: regForm.phone || null,
          date_of_birth: regForm.date_of_birth || null,
          email: regForm.email,
        });
        if (dup.count > 0) {
          setDuplicates(dup.duplicates || []);
          setRegistering(false);
          return;
        }
      }
      const created = await apiPost('/api/records/register', {
        ...regForm,
        phone: regForm.phone || null,
        date_of_birth: regForm.date_of_birth || null,
        data_consent: true,
        force_duplicate: force,
      });
      showToast(setToast, `Registered ${created.mrn || created.full_name}`, 'success');
      setRegisterOpen(false);
      setDuplicates([]);
      setRegForm({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        date_of_birth: '',
        data_consent: false,
      });
      search(created.mrn || '');
      if (created?.id) openPatient(created);
    } catch (err) {
      if (err.status === 409 && err.data?.duplicates) {
        setDuplicates(err.data.duplicates);
      } else {
        showToast(setToast, err.message || 'Registration failed', 'error');
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleMerge = async (e) => {
    e.preventDefault();
    setMerging(true);
    try {
      await apiPost('/api/records/merge', mergeForm);
      showToast(setToast, 'Patients merged', 'success');
      setMergeOpen(false);
      setMergeForm({ survivor_id: '', duplicate_id: '', reason: '' });
      search(query);
      setSelected(null);
    } catch (err) {
      showToast(setToast, err.message || 'Merge failed', 'error');
    } finally {
      setMerging(false);
    }
  };

  const exportPatient = async (format) => {
    if (!selected?.id) return;
    try {
      await apiDownload(
        `/api/records/${selected.id}/export?format=${format}`,
        `patient-record.${format}`
      );
      showToast(setToast, `Exported ${format.toUpperCase()}`, 'success');
    } catch (err) {
      showToast(setToast, err.message || 'Export failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Patient Records</h1>
          <p className="text-sm text-text-secondary mt-1">
            Search by name, MRN, phone, or DOB. View timeline, register, merge, export.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setMergeOpen(true)}>
            <GitMerge className="h-4 w-4 mr-1.5" />
            Merge
          </Button>
          <Button type="button" variant="primary" onClick={() => setRegisterOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Register patient
          </Button>
        </div>
      </div>

      <Card>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            search(query);
          }}
        >
          <div className="min-w-0 flex-1">
            <Input
              placeholder="Name, MRN, phone, email, or DOB (YYYY-MM-DD)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-text-muted" />}
            />
          </div>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => search('')} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </form>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Patients</h2>
          <Table>
            <TableHead>
              <TableRow>
                <Th>MRN</Th>
                <Th>Name</Th>
                <Th>Phone</Th>
                <Th>DOB</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <Td colSpan={4} className="text-text-muted text-center py-6">
                    {loading ? 'Loading…' : 'No patients found'}
                  </Td>
                </TableRow>
              ) : (
                patients.map((p) => (
                  <TableRow
                    key={p.id}
                    className={`cursor-pointer ${selected?.id === p.id ? 'bg-primary/10' : ''}`}
                    onClick={() => openPatient(p)}
                  >
                    <Td className="font-mono text-xs">{p.mrn || '—'}</Td>
                    <Td>
                      <div className="font-medium">{p.full_name || '—'}</div>
                      <div className="text-xs text-text-muted">{p.email}</div>
                    </Td>
                    <Td>{p.phone || '—'}</Td>
                    <Td>{p.date_of_birth || '—'}</Td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <Card>
          {!selected ? (
            <p className="text-sm text-text-muted py-8 text-center">Select a patient to view timeline</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">{selected.full_name}</h2>
                  <p className="text-sm text-text-secondary font-mono">{selected.mrn || selected.id}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-secondary">
                    {selected.phone && <Badge>{selected.phone}</Badge>}
                    {selected.date_of_birth && <Badge>DOB {selected.date_of_birth}</Badge>}
                    {selected.is_active === false && <Badge variant="error">Inactive</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => exportPatient('pdf')}>
                    <Download className="h-3.5 w-3.5 mr-1" />
                    PDF
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => exportPatient('xlsx')}>
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Excel
                  </Button>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-text-primary">Visit timeline</h3>
              {timelineLoading ? (
                <p className="text-sm text-text-muted">Loading timeline…</p>
              ) : timeline.length === 0 ? (
                <p className="text-sm text-text-muted">No encounters yet</p>
              ) : (
                <ul className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                  {timeline.map((ev) => (
                    <li key={`${ev.type}-${ev.source_id}`} className="border-l-2 border-primary/40 pl-3">
                      <div className="text-xs text-text-muted">{formatWhen(ev.occurred_at)}</div>
                      <div className="text-sm font-medium text-text-primary">
                        <span className="uppercase text-[10px] tracking-wide text-primary mr-2">
                          {ev.type.replace(/_/g, ' ')}
                        </span>
                        {ev.summary}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      </div>

      <Modal open={registerOpen} onClose={() => { setRegisterOpen(false); setDuplicates([]); }} title="Register patient">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            checkDupThenRegister(false);
          }}
        >
          <Input
            label="Full name"
            required
            value={regForm.full_name}
            onChange={(e) => setRegForm((f) => ({ ...f, full_name: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            required
            value={regForm.email}
            onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Temporary password"
            type="password"
            required
            minLength={8}
            value={regForm.password}
            onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
          />
          <Input
            label="Phone"
            value={regForm.phone}
            onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label="Date of birth"
            type="date"
            value={regForm.date_of_birth}
            onChange={(e) => setRegForm((f) => ({ ...f, date_of_birth: e.target.value }))}
          />
          <label className="flex items-start gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={regForm.data_consent}
              onChange={(e) => setRegForm((f) => ({ ...f, data_consent: e.target.checked }))}
              required
            />
            <span>
              Patient (or guardian) consents to storage of personal and health data for care,
              records, and hospital operations.
            </span>
          </label>

          {duplicates.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-900 mb-2">Possible duplicates found</p>
              <ul className="space-y-1 text-amber-800">
                {duplicates.map((d) => (
                  <li key={d.id}>
                    {d.mrn} — {d.full_name} ({(d.match_reasons || []).join(', ')})
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                disabled={registering}
                onClick={() => checkDupThenRegister(true)}
              >
                Register anyway
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={registering || !regForm.data_consent}>
              {registering ? 'Saving…' : 'Check & register'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={mergeOpen} onClose={() => setMergeOpen(false)} title="Merge duplicate patients">
        <form className="space-y-3" onSubmit={handleMerge}>
          <p className="text-sm text-text-secondary">
            All clinical data from the duplicate is moved to the survivor. The duplicate account is deactivated.
          </p>
          <Input
            label="Survivor patient ID (keep)"
            required
            value={mergeForm.survivor_id}
            onChange={(e) => setMergeForm((f) => ({ ...f, survivor_id: e.target.value }))}
            placeholder={selected?.id || 'UUID'}
          />
          <Input
            label="Duplicate patient ID (merge away)"
            required
            value={mergeForm.duplicate_id}
            onChange={(e) => setMergeForm((f) => ({ ...f, duplicate_id: e.target.value }))}
          />
          <Input
            label="Reason"
            value={mergeForm.reason}
            onChange={(e) => setMergeForm((f) => ({ ...f, reason: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setMergeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={merging}>
              {merging ? 'Merging…' : 'Merge'}
            </Button>
          </div>
        </form>
      </Modal>

      {toast.show && (
        <Toast message={toast.message} type={toast.type} visible={toast.show} />
      )}
    </div>
  );
}
