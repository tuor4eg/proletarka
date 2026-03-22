import Link from "next/link";
import { db } from "@/db";
import { entities, people } from "@/db/schema";
import { eq, asc, desc, ilike } from "drizzle-orm";
import { Suspense } from "react";
import { PublicNavWrapper } from "@/components/PublicNavWrapper";
import { PublicFilters } from "@/components/PublicFilters";

const SORT_OPTIONS = [
  { value: "title_asc", label: "По имени А→Я" },
  { value: "title_desc", label: "По имени Я→А" },
  { value: "date_desc", label: "Новые сначала" },
  { value: "date_asc", label: "Старые сначала" },
];

type SearchParams = Promise<{ q?: string; sort?: string }>;

function formatYears(birthYear: number | null, deathYear: number | null, yearsLabel: string | null) {
  if (birthYear || deathYear) {
    return `${birthYear ?? "?"}–${deathYear ?? "..."}`;
  }
  return yearsLabel ?? null;
}

export default async function PeoplePage({ searchParams }: { searchParams: SearchParams }) {
  const { q, sort = "title_asc" } = await searchParams;

  const orderBy =
    sort === "title_desc" ? desc(people.name) :
    sort === "date_desc" ? desc(entities.id) :
    sort === "date_asc" ? asc(entities.id) :
    asc(people.name);

  const rows = await db
    .select({
      entityId: entities.id,
      name: people.name,
      birthYear: people.birthYear,
      deathYear: people.deathYear,
      yearsLabel: people.yearsLabel,
      mainPhotoPath: people.mainPhotoPath,
    })
    .from(entities)
    .innerJoin(people, eq(entities.personId, people.id))
    .where(q ? ilike(people.name, `%${q}%`) : undefined)
    .orderBy(orderBy);

  return (
    <>
      <PublicNavWrapper />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Люди</h1>
        <Suspense>
          <PublicFilters q={q ?? ""} sort={sort} sortOptions={SORT_OPTIONS} />
        </Suspense>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">Ничего не найдено.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {rows.map((row) => {
              const years = formatYears(row.birthYear, row.deathYear, row.yearsLabel);
              return (
                <Link key={row.entityId} href={`/people/${row.entityId}`} className="flex flex-col gap-2 group">
                  <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
                    {row.mainPhotoPath ? (
                      <img
                        src={row.mainPhotoPath}
                        alt={row.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl font-light">
                        {row.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium group-hover:text-gray-600 transition-colors">{row.name}</p>
                    {years && <p className="text-xs text-gray-400">{years}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
