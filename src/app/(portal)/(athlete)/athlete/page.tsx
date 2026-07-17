import { CalendarDays, ClipboardList, User, Tag } from "lucide-react";
import { NavTile } from "@/components/ui/nav-tile";

export default function AthleteHomePage() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <NavTile href="/athlete/events" label="Upcoming Events" icon={<CalendarDays size={28} />} />
      <NavTile href="/athlete/results" label="Results" icon={<ClipboardList size={28} />} />
      <NavTile href="/athlete/profile" label="My Profile" icon={<User size={28} />} />
      <NavTile href="/athlete/membership" label="Membership" icon={<Tag size={28} />} />
    </div>
  );
}
