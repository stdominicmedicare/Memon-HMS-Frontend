/** Role values – must match backend and Supabase profiles.role */
export const ROLES = {
  GeneralUser: 'GeneralUser',
  Patient: 'Patient',
  Doctor: 'Doctor',
  Admin: 'Admin',
  Ambulance: 'Ambulance',
  ICU: 'ICU',
  Pharmacy: 'Pharmacy',
  BloodBank: 'BloodBank',
};

export const ROLE_ROUTES = {
  [ROLES.Admin]: '/admin',
  [ROLES.Patient]: '/patient',
  [ROLES.Doctor]: '/doctor',
  [ROLES.Ambulance]: '/ambulance',
  [ROLES.ICU]: '/icu',
  [ROLES.Pharmacy]: '/pharmacy',
  [ROLES.BloodBank]: '/bloodbank',
  'Blood Bank': '/bloodbank', // allow DB value with space
  [ROLES.GeneralUser]: '/dashboard',
};

export const ROLE_LABELS = {
  [ROLES.GeneralUser]: 'General User',
  [ROLES.Patient]: 'Patient',
  [ROLES.Doctor]: 'Doctor',
  [ROLES.Admin]: 'Administrator',
  [ROLES.Ambulance]: 'Ambulance Driver',
  [ROLES.ICU]: 'ICU Staff',
  [ROLES.Pharmacy]: 'Pharmacist',
  [ROLES.BloodBank]: 'Blood Bank Staff',
};
