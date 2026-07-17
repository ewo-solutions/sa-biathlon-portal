import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";

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
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ink-950">Results</h1>
      <Card>
        {seasons.length === 0 && (
          <p className="text-sm text-ink-500">No results on file yet.</p>
        )}
        <div className="divide-y divide-ink-200">
          {seasons.map((season) => (
            <details key={season} className="group py-4 first:pt-0 last:pb-0">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink-800">
                {season} Results
                <span className="text-ink-400 group-open:hidden">+</span>
                <span className="hidden text-ink-400 group-open:inline">−</span>
              </summary>
              <ul className="mt-3 space-y-2 pl-1 text-sm text-ink-600">
                {bySeason[season].map((result) => (
                  <li key={result.id} className="flex items-center justify-between">
                    <span>{result.event.name}</span>
                    <span className="flex items-center gap-3">
                      {result.position && <span>#{result.position}</span>}
                      {result.documentUrl && (
                        <a
                          href={result.documentUrl}
                          className="text-brand-600 hover:underline"
                        >
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
      </Card>
    </div>
  );
}
