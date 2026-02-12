/**
 * ICU History – discharged admission records, reports.
 */
import { Card } from '../../components/common';
import { useIcuHistory } from '../../hooks/useIcuApi';
import IcuPageNav from './IcuPageNav';

function formatDate(iso) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function ICUHistory() {
  const { data: history = [], isLoading } = useIcuHistory();

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
      <h1 className="text-xl font-bold text-text-primary">ICU History & Logs</h1>
      <Card hover={false}>
        {history.length === 0 ? (
          <p className="py-8 text-center text-text-muted">No discharge records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="pb-2 pr-4 font-medium">Patient</th>
                  <th className="pb-2 pr-4 font-medium">Bed</th>
                  <th className="pb-2 pr-4 font-medium">Admission</th>
                  <th className="pb-2 pr-4 font-medium">Discharge</th>
                  <th className="pb-2 font-medium">Reason / Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 text-text-primary">{r.patient?.full_name || '–'}</td>
                    <td className="py-3 pr-4 text-text-secondary">{r.bed?.bed_number || '–'}</td>
                    <td className="py-3 pr-4 text-text-secondary">{formatDate(r.admission_time)}</td>
                    <td className="py-3 pr-4 text-text-secondary">{formatDate(r.discharge_time)}</td>
                    <td className="py-3 text-text-secondary">
                      {[r.discharge_reason, r.final_status].filter(Boolean).join(' • ') || '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
