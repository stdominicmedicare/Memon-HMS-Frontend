import { Link } from 'react-router-dom';
import { Button } from '../components/common';

export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-light p-4">
      <h1 className="text-2xl font-bold text-text-primary">Access denied</h1>
      <p className="text-text-secondary">You don&apos;t have permission to view this page.</p>
      <Link to="/">
        <Button variant="primary">Go to dashboard</Button>
      </Link>
    </div>
  );
}
