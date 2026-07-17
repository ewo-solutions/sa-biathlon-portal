import Link from "next/link";
import { signOut } from "@/lib/auth";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export function DashboardShell({
  navItems,
  userName,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ink-50">
      <aside className="flex w-72 shrink-0 flex-col bg-ink-950 px-6 py-8 text-ink-100">
        <div className="mb-10 px-2 text-lg font-semibold text-white">SA Biathlon</div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink-200 transition hover:bg-white/5 hover:text-white"
            >
              <span className="text-ink-400">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <a
          href="https://sabiathlon.co.za"
          className="mt-4 rounded-xl px-4 py-3 text-sm font-medium text-ink-400 transition hover:bg-white/5 hover:text-white"
        >
          Back to website
        </a>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-end gap-4 border-b border-ink-200 bg-white px-8 py-4">
          <span className="text-sm font-medium text-ink-700">{userName}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-xl border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50"
            >
              Log out
            </button>
          </form>
        </header>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
