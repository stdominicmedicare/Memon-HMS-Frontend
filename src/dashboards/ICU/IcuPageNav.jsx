/**
 * In-page navigation for ICU – always visible links to Dashboard, Admission Requests, Monitoring, History.
 */
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Activity, History } from 'lucide-react';

const links = [
  { to: '/icu', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/icu/admission-requests', label: 'Admission Requests', icon: FileText },
  { to: '/icu/monitoring', label: 'Patient Monitoring', icon: Activity },
  { to: '/icu/history', label: 'History & Logs', icon: History },
];

export default function IcuPageNav() {
  return (
    <nav
      className="flex flex-wrap items-center gap-2 rounded-card border border-border bg-surface p-3 shadow-card"
      aria-label="ICU sections"
    >
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `inline-flex items-center gap-2 rounded-button px-4 py-2.5 text-sm font-semibold transition-colors touch-manipulation ${
              isActive
                ? 'bg-primary text-white'
                : 'bg-surface-muted text-text-primary hover:bg-primary/15 hover:text-primary'
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
