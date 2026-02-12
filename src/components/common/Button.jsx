/**
 * Design system: Button. Uses theme tokens only.
 * Variants: primary | secondary | outline | danger
 */
export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-button px-4 py-2.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98] touch-manipulation';
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark disabled:opacity-50',
    secondary:
      'bg-surface-muted text-text-primary hover:bg-border disabled:opacity-50',
    outline:
      'border-2 border-border bg-transparent text-text-primary hover:bg-surface-muted disabled:opacity-50',
    danger:
      'bg-error text-white hover:bg-red-600 disabled:opacity-50',
  };
  const width = fullWidth ? 'w-full' : '';
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${width} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
