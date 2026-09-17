/**
 * Nurse / Receptionist shell — links into Patient Records workflows.
 */
import { Link } from 'react-router-dom';
import { useAuthContext } from '../../auth/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import { Card, Button } from '../../components/common';
import { FolderOpen } from 'lucide-react';

export default function StaffPortal() {
  const { role, profile } = useAuthContext();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {ROLE_LABELS[role] || 'Staff'} portal
        </h1>
        <p className="mt-1 text-text-secondary">
          Signed in as {profile?.full_name || profile?.email || 'staff'}.
        </p>
      </div>
      <Card className="space-y-4">
        <p className="text-text-secondary">
          Use Patient Records to search by name, MRN, phone, or date of birth; register new
          patients with duplicate checks; and open a full visit timeline.
        </p>
        <Link to="/admin/patients">
          <Button variant="primary">
            <FolderOpen className="h-4 w-4" />
            Open Patient Records
          </Button>
        </Link>
      </Card>
    </div>
  );
}
