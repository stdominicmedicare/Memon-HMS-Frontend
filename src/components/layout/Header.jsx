/**
 * Global header – dark teal (MediCare reference), white nav, primary CTA.
 * NavLink for active state; proper routing.
 */
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Plus, LogOut, Building2 } from 'lucide-react';
import { useAuthContext } from '../../auth/AuthContext';
import { ROLE_ROUTES } from '../../utils/constants';

function getHomePath(role) {
  return (role && ROLE_ROUTES[role]) || '/';
}

function getPortalTitle(role, pathname) {
  if (pathname?.startsWith('/admin/pharmacy')) return 'Pharmacy Management Panel';
  if (pathname?.startsWith('/admin/bloodbank')) return 'Blood Bank Management Dashboard';
  if (role === 'Patient') return 'Patient Portal';
  if (role === 'Doctor') return 'Doctor Portal';
  if (role === 'Ambulance') return 'Ambulance Dashboard';
  if (role === 'ICU') return 'ICU Management Dashboard';
  if (role === 'Pharmacy') return 'Pharmacy Management Panel';
  if (role === 'BloodBank' || role === 'Blood Bank') return 'Blood Bank Management Dashboard';
  return null;
}

export default function Header({ onMenuClick }) {
  const { profile, signOut, role } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const portalTitle = getPortalTitle(role, location.pathname);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors touch-manipulation ${
      isActive ? 'text-cta' : 'text-white/90 hover:text-white'
    }`;

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between px-4 md:px-6 lg:px-8"
      style={{ backgroundColor: 'var(--color-header-footer)' }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="touch-manipulation rounded-button p-2 text-white md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <NavLink to={role === 'Admin' && (location.pathname.startsWith('/admin/pharmacy') || location.pathname.startsWith('/admin/bloodbank')) ? (location.pathname.startsWith('/admin/bloodbank') ? '/admin/bloodbank' : '/admin/pharmacy') : (role === 'Blood Bank' ? '/bloodbank' : getHomePath(role))} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            {portalTitle ? (
              <Building2 className="h-5 w-5 text-white" />
            ) : (
              <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
            )}
          </span>
          <span className="flex flex-col">
            {portalTitle ? (
              <>
                <span className="font-semibold text-white leading-tight">{portalTitle}</span>
                <span className="text-xs text-white/80 leading-tight">Hospital Management System</span>
              </>
            ) : (
              <span className="font-semibold text-white">Hospital Management System</span>
            )}
          </span>
        </NavLink>
      </div>

      <nav
        className={`items-center gap-2 md:gap-6 ${
          role === 'ICU' ? 'flex flex-wrap' : 'hidden md:flex'
        }`}
      >
        <NavLink to={getHomePath(role)} className={navLinkClass}>
          Home
        </NavLink>
        {role === 'Admin' && (
          <>
            <NavLink to="/admin/users" className={navLinkClass}>
              User Management
            </NavLink>
            <NavLink to="/admin/doctors" className={navLinkClass}>
              Doctor Management
            </NavLink>
            <NavLink to="/admin/ambulances" className={navLinkClass}>
              Ambulance
            </NavLink>
            <NavLink to="/admin/icu" className={navLinkClass}>
              ICU
            </NavLink>
            <NavLink to="/admin/pharmacy" className={navLinkClass}>
              Pharmacy
            </NavLink>
            <NavLink to="/admin/bloodbank" className={navLinkClass}>
              Blood Bank
            </NavLink>
            <NavLink to="/admin/roles" className={navLinkClass}>
              Role Assignment
            </NavLink>
          </>
        )}
        {role === 'ICU' && (
          <>
            <NavLink to="/icu" className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/icu/admission-requests" className={navLinkClass}>
              Admission Requests
            </NavLink>
            <NavLink to="/icu/monitoring" className={navLinkClass}>
              Monitoring
            </NavLink>
            <NavLink to="/icu/history" className={navLinkClass}>
              History
            </NavLink>
          </>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <span className="hidden max-w-[140px] truncate text-right text-sm sm:inline">
          <span className="block font-medium text-white">{profile?.full_name || profile?.email || 'User'}</span>
          {role && (
            <span className="block text-xs text-white/80">{role}</span>
          )}
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/90 text-sm font-semibold text-white">
          {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-button bg-cta px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 active:scale-[0.98] touch-manipulation"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
