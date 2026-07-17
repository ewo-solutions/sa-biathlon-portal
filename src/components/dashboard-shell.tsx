"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { Crest } from "@/components/crest";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export function DashboardShell({
  navItems,
  userName,
  onLogout,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  onLogout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-72 shrink-0 flex-col gap-2 rounded-r-[46px] bg-panel px-5 py-8 shadow-[0_0_34px_rgba(0,0,0,0.5)]">
        <div className="mb-8 flex justify-center">
          <Crest className="h-28 w-28" />
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`tracked-caps flex items-center gap-3 rounded-md px-4 py-4 text-sm font-black transition ${
                  active ? "bg-sage text-white" : "bg-panel-alt text-white hover:bg-sage/60"
                }`}
              >
                <span className="text-gold">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <a
          href="https://sabiathlon.co.za"
          className="tracked-caps flex items-center gap-3 rounded-md bg-panel-alt px-4 py-4 text-sm font-black text-white transition hover:bg-sage/60"
        >
          <LogOut className="text-gold" size={20} />
          Back to website
        </a>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-end gap-4 bg-gold px-8 py-6 shadow-[0_0_34px_rgba(0,0,0,0.25)]">
          <UserCircle className="text-panel" size={32} aria-label={userName} />
          <form action={onLogout}>
            <button
              type="submit"
              className="tracked-caps flex items-center gap-2 rounded-md bg-panel px-6 py-3 text-sm font-black text-white transition hover:bg-panel-alt"
            >
              <LogOut size={18} />
              Log out
            </button>
          </form>
        </header>
        <main className="p-10">{children}</main>
      </div>
    </div>
  );
}
