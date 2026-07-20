import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { saveGroup } from "../actions";

const inputClass = "w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";

export default async function EditCreateGroupPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const { groupId } = await searchParams;
  const group = groupId ? await prisma.group.findUnique({ where: { id: groupId } }) : null;

  return (
    <div>
      <h1 className="tracked-caps mb-6 text-2xl font-black text-white">
        {group ? "Edit Group" : "Create Group"}
      </h1>

      <Card title="Group information" className="max-w-2xl">
        <form action={saveGroup} className="space-y-4">
          {group && <input type="hidden" name="id" value={group.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Name</label>
              <input name="name" defaultValue={group?.name} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select name="gender" defaultValue={group?.gender ?? ""} className={inputClass}>
                <option value="">Mixed</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Age start</label>
              <input
                type="number"
                name="ageStart"
                defaultValue={group?.ageStart}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Age end</label>
              <input
                type="number"
                name="ageEnd"
                defaultValue={group?.ageEnd}
                required
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-white">
            <input
              type="checkbox"
              name="disabilityGroup"
              defaultChecked={group?.disabilityGroup}
              className="size-4"
            />
            Disability group
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Running distance (m)</label>
              <input
                type="number"
                name="runningDistanceMeters"
                defaultValue={group?.runningDistanceMeters ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Running points / second</label>
              <input
                type="number"
                step="0.0001"
                name="runningPointsPerSecond"
                defaultValue={group?.runningPointsPerSecond?.toString() ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Swimming distance (m)</label>
              <input
                type="number"
                name="swimmingDistanceMeters"
                defaultValue={group?.swimmingDistanceMeters ?? ""}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Swimming points / second</label>
              <input
                type="number"
                step="0.0001"
                name="swimmingPointsPerSecond"
                defaultValue={group?.swimmingPointsPerSecond?.toString() ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bonus points</label>
            <input
              type="number"
              step="0.01"
              name="bonusPoints"
              defaultValue={group?.bonusPoints?.toString() ?? ""}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            className="tracked-caps bg-gold px-6 py-3 text-sm font-black text-panel-alt transition hover:bg-gold-light"
          >
            {group ? "Save changes" : "Create group"}
          </button>
        </form>
      </Card>
    </div>
  );
}
