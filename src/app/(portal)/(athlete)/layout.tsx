import { Home, CalendarDays, ClipboardList, User, Tag, Headphones } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const navItems: NavItem[] = [
  { label: "Home", href: "/athlete", icon: <Home size={18} /> },
  { label: "Upcoming Events", href: "/athlete/events", icon: <CalendarDays size={18} /> },
  { label: "Results", href: "/athlete/results", icon: <ClipboardList size={18} /> },
  { label: "My Profile", href: "/athlete/profile", icon: <User size={18} /> },
  { label: "Membership", href: "/athlete/membership", icon: <Tag size={18} /> },
  { label: "Support", href: "/athlete/support", icon: <Headphones size={18} /> },
];

export default async function AthleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ATHLETE") {
    redirect("/login");
  }

  return (
    <DashboardShell navItems={navItems} userName={session.user.name ?? "Athlete"}>
      {children}
    </DashboardShell>
  );
}
