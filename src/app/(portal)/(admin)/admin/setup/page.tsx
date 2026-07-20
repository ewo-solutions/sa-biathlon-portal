import { MapPin, School as SchoolIcon, Users2 } from "lucide-react";
import { NavTile } from "@/components/ui/nav-tile";

export default function AdminSetupPage() {
  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Setup</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <NavTile href="/admin/setup/provinces" label="Provinces" icon={<MapPin size={28} />} />
        <NavTile href="/admin/setup/schools" label="Schools / Clubs" icon={<SchoolIcon size={28} />} />
        <NavTile href="/admin/setup/groups" label="Groups" icon={<Users2 size={28} />} />
      </div>
    </div>
  );
}
