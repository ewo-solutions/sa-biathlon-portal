import { Home, Zap, CalendarDays, User, BarChart3, Settings } from "lucide-react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const navItems: NavItem[] = [
  { label: "Home", href: "/admin", icon: <Home size={20} /> },
  { label: "Athletes", href: "/admin/athletes", icon: <Zap size={20} /> },
  { label: "Events", href: "/admin/events", icon: <CalendarDays size={20} /> },
  { label: "Setup", href: "/admin/setup", icon: <Settings size={20} /> },
  { label: "My Profile", href: "/admin/profile", icon: <User size={20} /> },
  { label: "Statistics", href: "/admin/statistics", icon: <BarChart3 size={20} /> },
];

async function logout() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <DashboardShell navItems={navItems} userName={session.user.name ?? "Admin"} onLogout={logout}>
      {children}
    </DashboardShell>
  );
}
