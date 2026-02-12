/**
 * Design system: Input. Uses theme tokens only.
 * Optional left icon slot.
 */
export default function Input({
  label,
  type = 'text',
  error,
  leftIcon,
  className = '',
  id,
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
  const base =
    'w-full rounded-input border border-border bg-surface px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
  const withIcon = leftIcon ? 'pl-10' : '';

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          className={`${base} ${withIcon} ${error ? 'border-error' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
