/**
 * Mobile bottom nav – Lucide icons, touch-friendly, active state.
 */
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../auth/AuthContext';
import { LayoutDashboard, Users, Shield, Stethoscope, FileText, Activity, History, Pill, Droplets } from 'lucide-react';

const adminNav = [
  { to: '/admin', label: 'Home', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/roles', label: 'Roles', icon: Shield },
];

const icuNav = [
  { to: '/icu', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/icu/admission-requests', label: 'Requests', icon: FileText },
  { to: '/icu/monitoring', label: 'Monitoring', icon: Activity },
  { to: '/icu/history', label: 'History', icon: History },
];

export default function MobileNav() {
  const { role } = useAuthContext();
  const location = useLocation();

  const pharmacyNav = [{ to: '/pharmacy', label: 'Home', icon: Pill }];
  const bloodBankNav = [{ to: '/bloodbank', label: 'Home', icon: Droplets }];
  const items = role === 'Admin' ? adminNav
    : role === 'ICU' ? icuNav
    : role === 'Pharmacy' ? pharmacyNav
    : role === 'BloodBank' || role === 'Blood Bank' ? bloodBankNav
    : [{ to: getHomePath(role), label: 'Home', icon: LayoutDashboard }];

  function getHomePath(r) {
    if (r === 'Patient') return '/patient';
    if (r === 'Doctor') return '/doctor';
    if (r === 'Ambulance') return '/ambulance';
    if (r === 'ICU') return '/icu';
    if (r === 'Pharmacy') return '/pharmacy';
    if (r === 'BloodBank' || r === 'Blood Bank') return '/bloodbank';
    return '/';
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-surface py-2 pb-safe md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      {items.map(({ to, label, icon: Icon }) => {
        const isActive = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-1 rounded-button px-4 py-2 text-xs touch-manipulation transition-colors ${
              isActive ? 'text-primary' : 'text-text-muted'
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
