export const dynamic = 'force-dynamic'

import Link from "next/link"
import { db } from "@/db"
import { entities, artifacts } from "@/db/schema"
import { eq, asc, sql } from "drizzle-orm"
import { fetchFirstPhotoMap } from "@/db/queries"
import { PageHero } from "@/components/PageHero"

export default async function FundsPage() {
    const rows = await db
        .select({
            entityId: entities.id,
            code: artifacts.code,
            title: artifacts.title,
            yearsLabel: artifacts.yearsLabel,
            yearFrom: artifacts.yearFrom,
            yearTo: artifacts.yearTo,
            coverImagePath: artifacts.coverImagePath,
        })
        .from(artifacts)
        .innerJoin(entities, eq(entities.artifactId, artifacts.id))
        .where(eq(artifacts.artifactType, "fund"))
        .orderBy(sql`${artifacts.yearFrom} ASC NULLS LAST`, asc(artifacts.title))

    const noCoverIds = rows.filter((r) => !r.coverImagePath).map((r) => r.entityId)
    const fallbackMap = await fetchFirstPhotoMap(noCoverIds)

    return (
        <>
            <PageHero title="Фонды" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                {rows.length === 0 ? (
                    <p className="text-sm text-ink-muted">Фонды не найдены.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {rows.map((row) => {
                            const coverImagePath = row.coverImagePath ?? fallbackMap.get(row.entityId) ?? null
                            const years = row.yearFrom
                                ? row.yearTo
                                    ? `${row.yearFrom}–${row.yearTo}`
                                    : String(row.yearFrom)
                                : row.yearsLabel

                            return (
                                <Link
                                    key={row.code}
                                    href={`/artifacts/${row.code}`}
                                    className="group flex flex-col gap-2"
                                >
                                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-paper-dark">
                                        {coverImagePath ? (
                                            <img
                                                src={coverImagePath}
                                                alt={row.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full" />
                                        )}
                                    </div>
                                    <div className="px-1">
                                        <p className="text-sm font-medium leading-snug">{row.title}</p>
                                        {years && (
                                            <p className="text-xs text-ink-muted mt-0.5">{years}</p>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </main>
        </>
    )
}
