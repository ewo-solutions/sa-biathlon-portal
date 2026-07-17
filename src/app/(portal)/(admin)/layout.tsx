import { Home, CalendarDays, PlusSquare, Users, BarChart3, User } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const navItems: NavItem[] = [
  { label: "Home", href: "/admin", icon: <Home size={18} /> },
  { label: "Events", href: "/admin/events", icon: <CalendarDays size={18} /> },
  { label: "Edit & Create Events", href: "/admin/events/new", icon: <PlusSquare size={18} /> },
  { label: "Athletes Profiles", href: "/admin/athletes", icon: <Users size={18} /> },
  { label: "Statistics", href: "/admin/statistics", icon: <BarChart3 size={18} /> },
  { label: "My Profile", href: "/admin/profile", icon: <User size={18} /> },
];

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
    <DashboardShell navItems={navItems} userName={session.user.name ?? "Admin"}>
      {children}
    </DashboardShell>
  );
}
