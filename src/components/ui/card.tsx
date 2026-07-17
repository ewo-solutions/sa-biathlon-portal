export function Card({
  title,
  className = "",
  children,
}: {
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-ink-200 ${className}`}>
      {title && <h2 className="mb-4 text-lg font-semibold text-ink-950">{title}</h2>}
      {children}
    </div>
  );
}
