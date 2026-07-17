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
    <div className={`bg-panel p-5 shadow-[0_0_34px_rgba(0,0,0,0.25)] sm:p-7 ${className}`}>
      {title && (
        <h2 className="tracked-caps mb-5 text-lg font-black text-white">{title}</h2>
      )}
      {children}
    </div>
  );
}
