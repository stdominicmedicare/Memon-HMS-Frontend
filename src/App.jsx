/**
 * App – AuthProvider, Router, role-based routes.
 * /login (public), /admin/* (Admin), /patient (Patient shell), /doctor (Doctor shell).
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleGuard from './routes/RoleGuard';
import { AppLayout } from './components/layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Unauthorized from './pages/Unauthorized';
import { AdminHome, UserManagement, RoleAssignment, DoctorManagement, AmbulanceManagement, ICUManagement } from './dashboards/Admin';
import { PatientDashboard } from './dashboards/Patient';
import { DoctorDashboard } from './dashboards/Doctor';
import { AmbulanceDashboard } from './dashboards/Ambulance';
import { ICUDashboard, AdmissionRequests, PatientMonitoring, ICUHistory } from './dashboards/ICU';
import { PharmacyDashboard } from './dashboards/Pharmacy';
import { BloodBankDashboard } from './dashboards/BloodBank';

function GeneralUserShell() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
      <p className="text-text-secondary">General user – Phase 1.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Admin']}>
                  <AppLayout>
                    <AdminHome />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Admin']}>
                  <AppLayout>
                    <UserManagement />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Admin']}>
                  <AppLayout>
                    <RoleAssignment />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Admin']}>
                  <AppLayout>
                    <DoctorManagement />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ambulances"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Admin']}>
                  <AppLayout>
                    <AmbulanceManagement />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/icu"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Admin']}>
                  <AppLayout>
                    <ICUManagement />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pharmacy"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Admin']}>
                  <AppLayout>
                    <PharmacyDashboard />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bloodbank"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Admin']}>
                  <AppLayout>
                    <BloodBankDashboard />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Patient']}>
                  <AppLayout>
                    <PatientDashboard />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Doctor']}>
                  <AppLayout>
                    <DoctorDashboard />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ambulance"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Ambulance']}>
                  <AppLayout>
                    <AmbulanceDashboard />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/icu"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ICU']}>
                  <AppLayout>
                    <ICUDashboard />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/icu/admission-requests"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ICU']}>
                  <AppLayout>
                    <AdmissionRequests />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/icu/monitoring"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ICU']}>
                  <AppLayout>
                    <PatientMonitoring />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/icu/history"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['ICU']}>
                  <AppLayout>
                    <ICUHistory />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['Pharmacy']}>
                  <AppLayout>
                    <PharmacyDashboard />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/bloodbank"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['BloodBank', 'Blood Bank', 'Admin']}>
                  <AppLayout>
                    <BloodBankDashboard />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleGuard allowedRoles={['GeneralUser']}>
                  <AppLayout>
                    <GeneralUserShell />
                  </AppLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
