import { ClipboardList } from "lucide-react";
import { NavTile } from "@/components/ui/nav-tile";
import { Card } from "@/components/ui/card";

export default function AdminReportsPage() {
  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">Reports</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <NavTile
          href="/admin/reports/participation"
          label="Participation & Affiliation"
          icon={<ClipboardList size={28} />}
        />
      </div>
      <Card className="mt-6" title="Other legacy reports">
        <p className="text-sm text-white/80">
          The following reports from the old system are not yet migrated: Provincial Ranking,
          National Ranking, Victor/Victrix, Team Selection, School Summary, Province Totals,
          Province Medal Report, and Province History. Let us know which of these you need
          first and we&rsquo;ll prioritise them.
        </p>
      </Card>
    </div>
  );
}
