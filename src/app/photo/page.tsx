export const dynamic = 'force-dynamic'

import Link from "next/link"
import { db } from "@/db"
import { entities, artifacts, entityTopics, topics } from "@/db/schema"
import { eq, asc, sql, isNull, and } from "drizzle-orm"
import { fetchFirstPhotoMap } from "@/db/queries"
import { PageHero } from "@/components/PageHero"

const PAGE_SIZE = 12

export default async function FundsPage({
    searchParams,
}: {
    searchParams: Promise<{ topic?: string; page?: string }>
}) {
    const { topic: topicParam, page: pageParam } = await searchParams
    const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1)

    // Lightweight: fetch topics that actually have funds
    const topicsWithFunds = await db
        .selectDistinct({ code: topics.code, title: topics.title })
        .from(topics)
        .innerJoin(entityTopics, eq(entityTopics.topicId, topics.id))
        .innerJoin(entities, eq(entities.id, entityTopics.entityId))
        .innerJoin(artifacts, eq(artifacts.id, entities.artifactId))
        .where(eq(artifacts.artifactType, "fund"))
        .orderBy(asc(topics.title))

    // Check if there are funds without any topic
    const [{ noTopicCount }] = await db
        .select({ noTopicCount: sql<number>`count(*)::int` })
        .from(artifacts)
        .innerJoin(entities, eq(entities.artifactId, artifacts.id))
        .leftJoin(entityTopics, eq(entityTopics.entityId, entities.id))
        .where(and(eq(artifacts.artifactType, "fund"), isNull(entityTopics.entityId)))

    const tabs = [
        ...topicsWithFunds,
        ...(noTopicCount > 0 ? [{ code: "other", title: "Разное" }] : []),
    ]

    const activeCode = topicParam ?? tabs[0]?.code ?? null

    if (!activeCode || tabs.length === 0) {
        return (
            <>
                <PageHero title="Фото" />
                <main className="max-w-2xl mx-auto px-4 py-8">
                    <p className="text-sm text-ink-muted">Фото не найдены.</p>
                </main>
            </>
        )
    }

    const isOther = activeCode === "other"

    // Count total for active topic
    const countQuery = db
        .select({ total: sql<number>`count(*)::int` })
        .from(artifacts)
        .innerJoin(entities, eq(entities.artifactId, artifacts.id))

    const [{ total }] = isOther
        ? await countQuery
            .leftJoin(entityTopics, eq(entityTopics.entityId, entities.id))
            .where(and(eq(artifacts.artifactType, "fund"), isNull(entityTopics.entityId)))
        : await countQuery
            .innerJoin(entityTopics, eq(entityTopics.entityId, entities.id))
            .innerJoin(topics, eq(topics.id, entityTopics.topicId))
            .where(and(eq(artifacts.artifactType, "fund"), eq(topics.code, activeCode)))

    const totalPages = Math.ceil(total / PAGE_SIZE)
    const safePage = Math.min(page, totalPages || 1)
    const offset = (safePage - 1) * PAGE_SIZE

    // Paginated funds for active topic
    const baseSelect = {
        entityId: entities.id,
        code: artifacts.code,
        title: artifacts.title,
        yearsLabel: artifacts.yearsLabel,
        yearFrom: artifacts.yearFrom,
        yearTo: artifacts.yearTo,
        coverImagePath: artifacts.coverImagePath,
    }

    const rows = isOther
        ? await db
            .select(baseSelect)
            .from(artifacts)
            .innerJoin(entities, eq(entities.artifactId, artifacts.id))
            .leftJoin(entityTopics, eq(entityTopics.entityId, entities.id))
            .where(and(eq(artifacts.artifactType, "fund"), isNull(entityTopics.entityId)))
            .orderBy(sql`${artifacts.yearFrom} ASC NULLS LAST`, asc(artifacts.title))
            .limit(PAGE_SIZE)
            .offset(offset)
        : await db
            .select(baseSelect)
            .from(artifacts)
            .innerJoin(entities, eq(entities.artifactId, artifacts.id))
            .innerJoin(entityTopics, eq(entityTopics.entityId, entities.id))
            .innerJoin(topics, eq(topics.id, entityTopics.topicId))
            .where(and(eq(artifacts.artifactType, "fund"), eq(topics.code, activeCode)))
            .orderBy(sql`${artifacts.yearFrom} ASC NULLS LAST`, asc(artifacts.title))
            .limit(PAGE_SIZE)
            .offset(offset)

    const noCoverIds = rows.filter((r) => !r.coverImagePath).map((r) => r.entityId)
    const fallbackMap = await fetchFirstPhotoMap(noCoverIds)

    return (
        <>
            <PageHero title="Фото" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="flex flex-wrap gap-2 mb-6">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.code}
                            href={`/photo?topic=${tab.code}`}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                tab.code === activeCode
                                    ? "bg-ink text-paper"
                                    : "bg-paper-dark text-ink-muted hover:text-ink"
                            }`}
                        >
                            {tab.title}
                        </Link>
                    ))}
                </div>

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

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {safePage > 1 && (
                            <Link
                                href={`/photo?topic=${activeCode}&page=${safePage - 1}`}
                                className="px-3 py-1 rounded text-sm text-ink-muted hover:text-ink transition-colors"
                            >
                                ←
                            </Link>
                        )}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <Link
                                key={p}
                                href={`/photo?topic=${activeCode}&page=${p}`}
                                className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${
                                    p === safePage
                                        ? "bg-ink text-paper font-medium"
                                        : "text-ink-muted hover:text-ink"
                                }`}
                            >
                                {p}
                            </Link>
                        ))}
                        {safePage < totalPages && (
                            <Link
                                href={`/photo?topic=${activeCode}&page=${safePage + 1}`}
                                className="px-3 py-1 rounded text-sm text-ink-muted hover:text-ink transition-colors"
                            >
                                →
                            </Link>
                        )}
                    </div>
                )}
            </main>
        </>
    )
}
