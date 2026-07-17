"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, UserCircle, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg lg:flex-row">
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 -translate-x-full flex-col gap-2 overflow-y-auto rounded-r-[46px] bg-panel px-5 py-8 shadow-[0_0_34px_rgba(0,0,0,0.5)] transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          menuOpen ? "translate-x-0" : ""
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="absolute right-4 top-4 text-white lg:hidden"
        >
          <X size={24} />
        </button>

        <div className="mb-8 flex justify-center">
          <Crest className="h-24 w-24 sm:h-28 sm:w-28" />
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
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

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 bg-gold px-4 py-4 shadow-[0_0_34px_rgba(0,0,0,0.25)] sm:px-8 sm:py-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="text-panel lg:hidden"
          >
            <Menu size={28} />
          </button>
          <div className="flex flex-1 items-center justify-end gap-4">
            <UserCircle className="text-panel" size={32} aria-label={userName} />
            <form action={onLogout}>
              <button
                type="submit"
                className="tracked-caps flex items-center gap-2 rounded-md bg-panel px-4 py-2.5 text-xs font-black text-white transition hover:bg-panel-alt sm:px-6 sm:py-3 sm:text-sm"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </form>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
