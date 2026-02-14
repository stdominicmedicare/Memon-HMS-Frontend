/**
 * Volunteer dashboard: availability toggle, active blood requests, accept button, donation history.
 */
import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/common';
import {
  useVolunteerProfile,
  useVolunteerDonationRequests,
  useVolunteerUpdateAvailability,
  useVolunteerAcceptRequest,
  useVolunteerDonations,
} from '../../hooks/useVolunteerApi';
import { BLOOD_GROUPS } from '../../utils/constants';
import { Droplets, Check, Clock, MapPin, AlertCircle } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'short' });
}

function formatTime(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function VolunteerDashboard() {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const { data: profile, isLoading: profileLoading } = useVolunteerProfile();
  const { data: requests = [], isLoading: requestsLoading, refetch: refetchRequests } = useVolunteerDonationRequests();
  const { data: donations = [], isLoading: donationsLoading } = useVolunteerDonations();
  const updateAvailability = useVolunteerUpdateAvailability();
  const acceptRequest = useVolunteerAcceptRequest();

  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
    return () => clearTimeout(t);
  }, [toast.show]);

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });

  const handleToggleAvailability = () => {
    const next = !profile?.is_available;
    updateAvailability.mutate(next, {
      onSuccess: () => showToast(next ? 'You are now available for requests' : 'Availability turned off'),
      onError: (err) => showToast(err?.message || 'Failed to update', 'error'),
    });
  };

  const handleAccept = (requestId) => {
    acceptRequest.mutate(requestId, {
      onSuccess: () => {
        showToast('Request accepted. Thank you! You will receive confirmation details.');
        refetchRequests();
      },
      onError: (err) => showToast(err?.message || 'Failed to accept', 'error'),
    });
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-text-muted">Loading…</p>
      </div>
    );
  }

  const hasBloodGroup = profile?.blood_group && BLOOD_GROUPS.includes(profile.blood_group);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-text-primary sm:text-2xl">Blood Donation Volunteer</h1>

      {/* Availability Toggle */}
      <Card className="space-y-3" hover={false}>
        <h2 className="text-lg font-semibold text-text-primary">Availability</h2>
        <p className="text-sm text-text-secondary">
          When ON, you will receive blood request notifications matching your blood group.
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={profile?.is_available ?? false}
            onClick={handleToggleAvailability}
            disabled={updateAvailability.isPending || !hasBloodGroup}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              profile?.is_available ? 'bg-success' : 'bg-border'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition ${
                profile?.is_available ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="font-medium text-text-primary">
            {profile?.is_available ? 'Available' : 'Unavailable'}
          </span>
        </div>
        {!hasBloodGroup && (
          <p className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Your blood group is not set. Contact admin.
          </p>
        )}
      </Card>

      {/* Active Blood Requests */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Active Blood Requests</h2>
        {requestsLoading ? (
          <Card hover={false}><p className="text-text-muted">Loading…</p></Card>
        ) : requests.length === 0 ? (
          <Card hover={false}>
            <p className="text-text-muted">No open requests for your blood group right now. Check back later.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id} className="space-y-2 border-l-4 border-error/80" hover={false}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 font-bold text-text-primary">
                    <Droplets className="h-5 w-5 text-error" />
                    {req.urgency === 'High' ? 'URGENT' : ''} {req.blood_group} Blood Needed
                  </span>
                  <Badge variant={req.urgency === 'High' ? 'error' : req.urgency === 'Medium' ? 'warning' : 'default'}>
                    {req.urgency}
                  </Badge>
                  {req.accepted_by_me && (
                    <Badge variant="success">You accepted</Badge>
                  )}
                </div>
                <p className="text-sm text-text-secondary">Quantity: {req.quantity_required} unit(s)</p>
                {req.location && (
                  <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {req.location}
                  </p>
                )}
                {!req.accepted_by_me && profile?.blood_group === req.blood_group && profile?.is_available && (
                  <Button
                    variant="primary"
                    className="mt-2"
                    onClick={() => handleAccept(req.id)}
                    disabled={acceptRequest.isPending}
                  >
                    Accept Request
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Donation History */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-text-primary">Donation History</h2>
        {donationsLoading ? (
          <Card hover={false}><p className="text-text-muted">Loading…</p></Card>
        ) : donations.length === 0 ? (
          <Card hover={false}>
            <p className="text-text-muted">No donations yet. When you accept a request and complete donation, it will appear here.</p>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pr-2 font-semibold text-text-primary">Date</th>
                  <th className="py-2 pr-2 font-semibold text-text-primary">Blood Group</th>
                  <th className="py-2 pr-2 font-semibold text-text-primary">Location</th>
                  <th className="py-2 pr-2 font-semibold text-text-primary">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id} className="border-b border-border/70">
                    <td className="py-2 pr-2 text-text-secondary">
                      {formatDate(d.completed_at || d.accepted_at)} {d.completed_at && formatTime(d.completed_at)}
                    </td>
                    <td className="py-2 pr-2 font-medium text-text-primary">{d.blood_group}</td>
                    <td className="py-2 pr-2 text-text-secondary">{d.location || '–'}</td>
                    <td className="py-2 pr-2">
                      {d.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <Check className="h-4 w-4" /> Completed
                        </span>
                      ) : d.status === 'cancelled' ? (
                        <span className="text-text-muted">Cancelled</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Clock className="h-4 w-4" /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
