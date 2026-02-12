/**
 * Design system: Badge. Uses theme tokens only.
 * Variants: default | success | warning | error | primary
 */
export default function Badge({ children, variant = 'default', className = '' }) {
  const base = 'inline-flex items-center rounded-button px-2 py-0.5 text-xs font-medium';
  const variants = {
    default: 'bg-surface-muted text-text-secondary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    error: 'bg-error/15 text-error',
    primary: 'bg-primary/15 text-primary',
    info: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`${base} ${variants[variant]} ${className}`.trim()}>
      {children}
    </span>
  );
}
