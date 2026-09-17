/**
 * Mobile bottom nav – Lucide icons, touch-friendly, active state.
 * Kept to ≤4 items so labels fit on 320–375px phones; full routes stay in the drawer.
 */
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../auth/AuthContext';
import { LayoutDashboard, Users, Activity, History, Pill, Droplets, FolderOpen, BarChart3, FileText } from 'lucide-react';

const adminNav = [
  { to: '/admin', label: 'Home', icon: LayoutDashboard },
  { to: '/admin/patients', label: 'Patients', icon: FolderOpen },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/users', label: 'Users', icon: Users },
];

const icuNav = [
  { to: '/icu', label: 'Home', icon: LayoutDashboard },
  { to: '/icu/admission-requests', label: 'Requests', icon: FileText },
  { to: '/icu/monitoring', label: 'Monitor', icon: Activity },
  { to: '/icu/history', label: 'History', icon: History },
];

function getHomePath(r) {
  if (r === 'Patient') return '/patient';
  if (r === 'Doctor') return '/doctor';
  if (r === 'Ambulance') return '/ambulance';
  if (r === 'ICU') return '/icu';
  if (r === 'Pharmacy') return '/pharmacy';
  if (r === 'BloodBank' || r === 'Blood Bank') return '/bloodbank';
  if (r === 'Volunteer') return '/volunteer';
  return '/';
}

export default function MobileNav() {
  const { role } = useAuthContext();
  const location = useLocation();

  const pharmacyNav = [{ to: '/pharmacy', label: 'Home', icon: Pill }];
  const bloodBankNav = [{ to: '/bloodbank', label: 'Home', icon: Droplets }];
  const volunteerNav = [{ to: '/volunteer', label: 'Home', icon: Droplets }];
  const items =
    role === 'Admin'
      ? adminNav
      : role === 'ICU'
        ? icuNav
        : role === 'Pharmacy'
          ? pharmacyNav
          : role === 'BloodBank' || role === 'Blood Bank'
            ? bloodBankNav
            : role === 'Volunteer'
              ? volunteerNav
              : [{ to: getHomePath(role), label: 'Home', icon: LayoutDashboard }];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around gap-0.5 border-t border-border bg-surface px-1 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {items.map(({ to, label, icon: Icon }) => {
        const isActive =
          location.pathname === to ||
          (to !== '/admin' && to !== '/icu' && location.pathname.startsWith(to));
        return (
          <Link
            key={to}
            to={to}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-button px-1 py-2 text-[10px] leading-tight touch-manipulation transition-colors xs:text-xs ${
              isActive ? 'text-primary' : 'text-text-muted'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span className="w-full truncate text-center">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
