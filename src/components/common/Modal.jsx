/**
 * Design system: Modal. Uses theme tokens only.
 * Compact size, scrollable body. Touch-friendly; no hover-only interactions.
 */
export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-text-primary/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        aria-hidden="true"
      />
      <div className="relative flex w-full max-w-md max-h-[85vh] flex-col rounded-card bg-surface shadow-dropdown">
        {title && (
          <div className="shrink-0 border-b border-border px-4 py-2.5">
            <h2 id="modal-title" className="text-base font-semibold text-text-primary">
              {title}
            </h2>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          {children}
        </div>
      </div>
    </div>
  );
}
