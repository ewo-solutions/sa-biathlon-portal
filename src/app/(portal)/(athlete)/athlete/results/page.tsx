import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AthleteResultsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const results = await prisma.result.findMany({
    where: { athleteProfile: { userId } },
    orderBy: [{ season: "desc" }, { createdAt: "desc" }],
    include: { event: true },
  });

  const bySeason = results.reduce<Record<number, typeof results>>((acc, result) => {
    (acc[result.season] ??= []).push(result);
    return acc;
  }, {});

  const seasons = Object.keys(bySeason)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="bg-panel shadow-[0_0_34px_rgba(0,0,0,0.25)]">
      <div className="bg-gold px-5 py-6 sm:px-8 sm:py-8">
        <h1 className="tracked-caps text-xl font-black text-panel-alt sm:text-2xl">
          Download Results Here
        </h1>
      </div>
      <div className="p-5 sm:p-8">
        {seasons.length === 0 && <p className="text-sm text-muted">No results on file yet.</p>}
        <div className="space-y-2">
          {seasons.map((season, i) => (
            <details key={season} className="group" open={i === 0}>
              <summary
                className={`tracked-caps flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-sm font-black text-white sm:px-6 sm:py-5 ${
                  i === 0 ? "bg-sage" : "bg-panel-alt"
                }`}
              >
                {season} Results
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">−</span>
              </summary>
              <ul className="space-y-2 px-4 py-4 text-sm text-white/80 sm:px-6">
                {bySeason[season].length === 0 && (
                  <li className="text-muted">No results recorded for this season yet.</li>
                )}
                {bySeason[season].map((result) => (
                  <li key={result.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{result.event.name}</span>
                    <span className="flex items-center gap-3">
                      {result.position && <span>#{result.position}</span>}
                      {result.documentUrl && (
                        <a href={result.documentUrl} className="text-gold hover:underline">
                          Download
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
