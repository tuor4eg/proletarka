export const dynamic = 'force-dynamic'

import Link from "next/link"
import { db } from "@/db"
import { entities, artifacts } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { PageHero } from "@/components/PageHero"

export default async function ExpositionPage() {
    const rows = await db
        .select({
            code: artifacts.code,
            title: artifacts.title,
            yearsLabel: artifacts.yearsLabel,
            coverImagePath: artifacts.coverImagePath,
        })
        .from(artifacts)
        .innerJoin(entities, eq(entities.artifactId, artifacts.id))
        .where(eq(artifacts.artifactType, "stand"))
        .orderBy(asc(artifacts.title))

    return (
        <>
            <PageHero title="Выставка" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <h2 className="text-lg font-semibold text-ink mb-6 pt-4">Стенды</h2>
                {rows.length === 0 ? (
                    <p className="text-sm text-ink-muted">Стенды не найдены.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {rows.map((row) => (
                            <Link
                                key={row.code}
                                href={`/artifacts/${row.code}`}
                                className="group flex flex-col gap-2"
                            >
                                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-paper-dark">
                                    {row.coverImagePath ? (
                                        <img
                                            src={row.coverImagePath}
                                            alt={row.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full" />
                                    )}
                                </div>
                                <div className="px-1">
                                    <p className="text-sm font-medium leading-snug">{row.title}</p>
                                    {row.yearsLabel && (
                                        <p className="text-xs text-ink-muted mt-0.5">{row.yearsLabel}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </>
    )
}
