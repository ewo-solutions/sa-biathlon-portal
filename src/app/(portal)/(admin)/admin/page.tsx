import { Zap, CalendarDays, User, BarChart3 } from "lucide-react";
import { NavTile } from "@/components/ui/nav-tile";

export default function AdminHomePage() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <NavTile href="/admin/athletes" label="Athletes" icon={<Zap size={28} />} />
      <NavTile href="/admin/events" label="Events" icon={<CalendarDays size={28} />} />
      <NavTile href="/admin/profile" label="My Profile" icon={<User size={28} />} />
      <NavTile href="/admin/statistics" label="Statistics" icon={<BarChart3 size={28} />} />
    </div>
  );
}
