export function Card({
  title,
  headerExtra,
  className = "",
  children,
}: {
  title?: string;
  headerExtra?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-panel p-5 shadow-[0_0_34px_rgba(0,0,0,0.25)] sm:p-7 ${className}`}>
      {(title || headerExtra) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="tracked-caps text-lg font-black text-white">{title}</h2>}
          {headerExtra}
        </div>
      )}
      {children}
    </div>
  );
}
