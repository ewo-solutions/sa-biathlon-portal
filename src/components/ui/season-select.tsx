"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SeasonSelect({
  seasons,
  paramName = "season",
}: {
  seasons: { id: string; label: string }[];
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? "";

  return (
    <select
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) params.set(paramName, e.target.value);
        else params.delete(paramName);
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="bg-sage px-3 py-2 text-xs text-white outline-none"
    >
      <option value="">All seasons</option>
      {seasons.map((season) => (
        <option key={season.id} value={season.id}>
          {season.label}
        </option>
      ))}
    </select>
  );
}
