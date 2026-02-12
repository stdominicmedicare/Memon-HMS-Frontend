/**
 * ICU Admission Requests – list pending requests, approve (with optional bed assign), reject.
 */
import { useState } from 'react';
import { Card, Button, Badge, Select, Modal } from '../../components/common';
import {
  useIcuDashboard,
  useIcuAdmissionRequests,
  useApproveIcuRequest,
  useRejectIcuRequest,
} from '../../hooks/useIcuApi';
import IcuPageNav from './IcuPageNav';

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdmissionRequests() {
  const [approveModal, setApproveModal] = useState(null);
  const [selectedBedId, setSelectedBedId] = useState('');

  const { data: dashboardData } = useIcuDashboard();
  const { data: requests = [], isLoading } = useIcuAdmissionRequests('pending');
  const approveRequest = useApproveIcuRequest();
  const rejectRequest = useRejectIcuRequest();

  const beds = dashboardData?.beds || [];
  const availableBeds = beds.filter((b) => b.status === 'available');

  const handleReject = (req) => {
    rejectRequest.mutate(req.id, {
      onSuccess: () => setApproveModal(null),
      onError: (e) => alert(e?.message || 'Failed'),
    });
  };

  const handleApprove = (withBed) => {
    if (!approveModal) return;
    const bedId = withBed ? selectedBedId : null;
    if (withBed && !bedId) {
      alert('Select a bed to assign');
      return;
    }
    approveRequest.mutate(
      { id: approveModal.id, assigned_bed_id: bedId || undefined },
      {
        onSuccess: () => {
          setApproveModal(null);
          setSelectedBedId('');
        },
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
      <h1 className="text-xl font-bold text-text-primary">Admission Requests</h1>
      <Card hover={false}>
        <div className="space-y-4">
          {requests.length === 0 ? (
            <p className="py-6 text-center text-text-muted">No pending admission requests.</p>
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((req) => (
                <li key={req.id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-text-primary">
                      Patient: {req.patient?.full_name || req.patient_id}
                    </p>
                    <p className="text-sm text-text-secondary">
                      Requested by Dr. {req.doctor?.full_name || req.doctor_id} • {formatDate(req.created_at)}
                    </p>
                    <p className="text-sm text-text-secondary">
                      Priority: <Badge variant="primary">{req.priority_level}</Badge>
                    </p>
                    {req.request_notes && (
                      <p className="mt-1 text-sm text-text-muted">{req.request_notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setApproveModal(req);
                        setSelectedBedId('');
                      }}
                    >
                      Approve / Assign Bed
                    </Button>
                    <Button variant="outline" onClick={() => handleReject(req)}>
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Modal
        open={!!approveModal}
        onClose={() => { setApproveModal(null); setSelectedBedId(''); }}
        title="Approve & Assign Bed"
      >
        {approveModal && (
          <div className="space-y-4">
            <p className="text-text-secondary">
              Patient: <span className="font-semibold text-text-primary">{approveModal.patient?.full_name}</span>
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-secondary">Assign to bed (optional)</label>
              <Select
                options={[
                  { value: '', label: 'Approve only (assign bed later)' },
                  ...availableBeds.map((b) => ({ value: b.id, label: `${b.bed_number} (${b.bed_type})` })),
                ]}
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => handleApprove(!!selectedBedId)}
                disabled={approveRequest.isPending}
              >
                {selectedBedId ? 'Approve & Admit to Bed' : 'Approve Only'}
              </Button>
              <Button variant="outline" onClick={() => handleReject(approveModal)}>
                Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
