import Link from "next/link"
import { db } from "@/db"
import { entities, artifacts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export async function HomeExposition() {
    const stands = await db
        .select({
            code: artifacts.code,
            title: artifacts.title,
            yearsLabel: artifacts.yearsLabel,
            yearFrom: artifacts.yearFrom,
            yearTo: artifacts.yearTo,
            coverImagePath: artifacts.coverImagePath,
        })
        .from(artifacts)
        .innerJoin(entities, eq(entities.artifactId, artifacts.id))
        .where(eq(artifacts.artifactType, "stand"))
        .orderBy(desc(artifacts.createdAt))
        .limit(4)

    if (stands.length === 0) return null

    return (
        <section className="pt-8 mb-10">
            <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-widest uppercase text-ink">Выставка</h2>
                <Link href="/exposition" className="text-xs text-ink-muted hover:text-ink transition-colors">
                    Подробнее
                </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stands.map((stand) => (
                    <Link
                        key={stand.code}
                        href={`/artifacts/${stand.code}`}
                        className="group flex flex-col gap-2"
                    >
                        <div className="aspect-square rounded-xl overflow-hidden bg-paper-dark">
                            {stand.coverImagePath ? (
                                <img
                                    src={stand.coverImagePath}
                                    alt={stand.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full" />
                            )}
                        </div>
                        <div className="px-1">
                            <p className="text-sm font-medium leading-snug">{stand.title}</p>
                            {(stand.yearFrom || stand.yearsLabel) && (
                                <p className="text-xs text-ink-muted mt-0.5">
                                    {stand.yearFrom
                                        ? stand.yearTo
                                            ? `${stand.yearFrom}–${stand.yearTo}`
                                            : String(stand.yearFrom)
                                        : stand.yearsLabel}
                                </p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
