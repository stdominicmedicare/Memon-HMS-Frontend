/**
 * In-page navigation for ICU – scrollable on narrow phones so links don't wrap messily.
 */
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Activity, History } from 'lucide-react';

const links = [
  { to: '/icu', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { to: '/icu/admission-requests', label: 'Admission Requests', shortLabel: 'Requests', icon: FileText },
  { to: '/icu/monitoring', label: 'Patient Monitoring', shortLabel: 'Monitor', icon: Activity },
  { to: '/icu/history', label: 'History & Logs', shortLabel: 'History', icon: History },
];

export default function IcuPageNav() {
  return (
    <nav
      className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1"
      aria-label="ICU sections"
    >
      {links.map(({ to, label, shortLabel, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `inline-flex shrink-0 items-center gap-2 rounded-button px-3 py-2.5 text-sm font-semibold transition-colors touch-manipulation sm:px-4 ${
              isActive
                ? 'bg-primary text-white'
                : 'border border-border bg-surface text-text-primary hover:bg-primary/15 hover:text-primary'
            }`
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
