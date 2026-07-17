import Link from "next/link";

export function NavTile({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-5 bg-panel p-6 shadow-[0_0_34px_rgba(0,0,0,0.25)] transition hover:bg-sage/40"
    >
      <span className="flex size-16 shrink-0 items-center justify-center bg-panel-alt text-gold">
        {icon}
      </span>
      <span className="tracked-caps text-xl font-black text-white">{label}</span>
    </Link>
  );
}
