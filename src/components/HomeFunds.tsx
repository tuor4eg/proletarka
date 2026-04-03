import Link from "next/link"
import { db } from "@/db"
import { entities, artifacts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { fetchFirstPhotoMap } from "@/db/queries"
import { HomePeople } from "@/components/HomePeople"

export async function HomeFunds() {
    const recentFunds = await db
        .select({
            entityId: entities.id,
            code: artifacts.code,
            title: artifacts.title,
            yearsLabel: artifacts.yearsLabel,
            coverImagePath: artifacts.coverImagePath,
        })
        .from(artifacts)
        .innerJoin(entities, eq(entities.artifactId, artifacts.id))
        .where(eq(artifacts.artifactType, "fund"))
        .orderBy(desc(artifacts.createdAt))
        .limit(4)

    const noCoverIds = recentFunds.filter((r) => !r.coverImagePath).map((r) => r.entityId)
    const fallbackMap = await fetchFirstPhotoMap(noCoverIds)

    const funds = recentFunds.map((r) => ({
        ...r,
        coverImagePath: r.coverImagePath ?? fallbackMap.get(r.entityId) ?? null,
    }))

    return (
        <section className="border-t border-paper-border pt-8 mb-10">
            <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-widest uppercase text-ink">Фонды</h2>
            </div>
            <HomePeople />
            {funds.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-baseline justify-between mb-4">
                        <h3 className="text-lg font-semibold text-ink">Фото</h3>
                        <Link href="/funds" className="text-xs text-ink-muted hover:text-ink transition-colors">
                            Подробнее
                        </Link>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {funds.map((fund) => (
                            <Link
                                key={fund.code}
                                href={`/artifacts/${fund.code}`}
                                className="flex flex-col items-center gap-2 w-20 shrink-0 hover:opacity-70 transition-opacity"
                            >
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-paper-dark">
                                    {fund.coverImagePath ? (
                                        <img src={fund.coverImagePath} alt={fund.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium text-ink leading-tight line-clamp-2">{fund.title}</p>
                                    {fund.yearsLabel && (
                                        <p className="text-xs text-ink-muted mt-0.5">{fund.yearsLabel}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </section>
    )
}
