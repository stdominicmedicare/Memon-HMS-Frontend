/**
 * Design system: Card. Interactive hover lift; theme tokens only.
 */
export default function Card({ children, className = '', padding = true, hover = true, ...props }) {
  const paddingClass = padding ? 'p-4 md:p-5' : '';
  const hoverClass = hover
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover'
    : '';
  return (
    <div
      className={`rounded-card bg-surface shadow-card ${paddingClass} ${hoverClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
