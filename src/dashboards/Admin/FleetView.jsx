/**
 * Admin Fleet View – monitor all ambulances, live map, stats, trip detail modal.
 */
import { useState } from 'react';
import { Card } from '../../components/common';
import { useFleetTracking } from '../../features/admin/hooks/useFleetTracking';
import FleetTrackingMap from '../../features/admin/components/FleetTrackingMap';
import FleetTripDetailModal from '../../features/admin/components/FleetTripDetailModal';
import { Ambulance, MapPin, Activity, CheckCircle } from 'lucide-react';

function StatCard({ icon: Icon, label, value, sub, iconBg }) {
  return (
    <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4" hover={false}>
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card text-white"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className="text-xl font-bold text-text-primary">{value}</p>
        {sub != null && <p className="text-xs text-text-muted">{sub}</p>}
      </div>
    </Card>
  );
}

export default function FleetView() {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { vehicles, stats, isLoading, refetch } = useFleetTracking();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Fleet View</h1>
        <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-border bg-surface-muted sm:min-h-[400px]">
          <p className="text-text-muted">Loading fleet…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Fleet View</h1>
          <p className="mt-1 text-text-secondary">Monitor all ambulances and active trips in real time.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Ambulance}
          label="Total Ambulances"
          value={stats.totalAmbulances ?? 0}
          iconBg="#e879f9"
        />
        <StatCard
          icon={CheckCircle}
          label="Available"
          value={stats.available ?? 0}
          sub="Ready for assignment"
          iconBg="#22c55e"
        />
        <StatCard
          icon={MapPin}
          label="Active Trips"
          value={stats.activeTripsCount ?? 0}
          sub="En route or at destination"
          iconBg="#dc2626"
        />
        <StatCard
          icon={Activity}
          label="Returning"
          value={stats.returning ?? 0}
          sub="On duty, heading back"
          iconBg="#eab308"
        />
      </div>

      <Card hover={false} className="overflow-hidden">
        <FleetTrackingMap
          vehicles={vehicles}
          stats={stats}
          onVehicleClick={setSelectedVehicle}
        />
      </Card>

      <FleetTripDetailModal
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        vehicle={selectedVehicle}
      />
    </div>
  );
}
