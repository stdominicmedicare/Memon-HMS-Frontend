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
  Volunteer: 'Volunteer',
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
  [ROLES.Volunteer]: '/volunteer',
  [ROLES.GeneralUser]: '/dashboard',
};

/** Blood groups for donors/volunteers/blood bank. */
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

/** Hospital locations for patient map (awareness mode). */
export const PATIENT_MAP_HOSPITALS = [
  { name: 'Main Hospital', lat: 40.7128, lng: -74.006 },
  { name: 'Emergency Center', lat: 40.7282, lng: -73.9942 },
];

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
