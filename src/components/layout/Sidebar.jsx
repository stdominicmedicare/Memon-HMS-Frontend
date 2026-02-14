/**
 * Sidebar – role-based menu. Drawer on mobile; always visible on desktop.
 * Active state: primary background (theme).
 */
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../auth/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import { LayoutDashboard, Users, Shield, Stethoscope, Ambulance, Bed, FileText, Activity, History, Pill, Droplets, MapPin } from 'lucide-react';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'User Management', icon: Users },
  { to: '/admin/doctors', label: 'Doctor Management', icon: Stethoscope },
  { to: '/admin/ambulances', label: 'Ambulance Management', icon: Ambulance },
  { to: '/admin/fleet', label: 'Fleet View', icon: MapPin },
  { to: '/admin/icu', label: 'ICU Management', icon: Bed },
  { to: '/admin/pharmacy', label: 'Pharmacy', icon: Pill },
  { to: '/admin/bloodbank', label: 'Blood Bank', icon: Droplets },
  { to: '/admin/roles', label: 'Role Assignment', icon: Shield },
];

const patientLinks = [{ to: '/patient', label: 'Dashboard', icon: LayoutDashboard }];
const doctorLinks = [{ to: '/doctor', label: 'Dashboard', icon: LayoutDashboard }];
const ambulanceLinks = [{ to: '/ambulance', label: 'Dashboard', icon: LayoutDashboard }];

const icuLinks = [
  { to: '/icu', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/icu/admission-requests', label: 'Admission Requests', icon: FileText },
  { to: '/icu/monitoring', label: 'Patient Monitoring', icon: Activity },
  { to: '/icu/history', label: 'History & Logs', icon: History },
];

const pharmacyLinks = [{ to: '/pharmacy', label: 'Dashboard', icon: Pill }];
const bloodBankLinks = [{ to: '/bloodbank', label: 'Dashboard', icon: Droplets }];
const generalUserLinks = [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }];

function getLinksForRole(role) {
  const r = role === 'Blood Bank' ? 'BloodBank' : role;
  if (r === 'Admin') return adminLinks;
  if (r === 'Patient') return patientLinks;
  if (r === 'Doctor') return doctorLinks;
  if (r === 'Ambulance') return ambulanceLinks;
  if (r === 'ICU') return icuLinks;
  if (r === 'Pharmacy') return pharmacyLinks;
  if (r === 'BloodBank') return bloodBankLinks;
  if (r === 'GeneralUser') return generalUserLinks;
  return [{ to: '/dashboard', label: 'Home', icon: LayoutDashboard }];
}

export default function Sidebar({ open, onClose }) {
  const { role } = useAuthContext();
  const links = getLinksForRole(role);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-text-primary/50 transition-opacity md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        aria-hidden="true"
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-surface shadow-card transition-transform md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Sidebar"
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-sm font-semibold text-text-primary">
            {role ? ROLE_LABELS[role] : 'Menu'}
          </span>
        </div>
        <nav className="p-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium touch-manipulation transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                }`
              }
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
