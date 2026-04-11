import Link from "next/link"
import { eq, asc, desc, ilike, and, count, inArray } from "drizzle-orm"
import { db } from "@/db"
import { entities, artifacts, entityTopics, topics, type ArtifactType } from "@/db/schema"
import { AdminFilters } from "@/components/AdminFilters"
import { Pagination } from "@/components/Pagination"
import { Suspense } from "react"

const TYPE_LABEL: Record<ArtifactType, string> = {
    general: "Объект",
    stand: "Стенд",
    rarity: "Экспонат",
    fund: "Фонд",
}
const TYPE_TITLES: Record<ArtifactType, string> = {
    general: "Объекты",
    stand: "Стенды",
    rarity: "Экспонаты",
    fund: "Фонды",
}

const PAGE_SIZE = 20

type SearchParams = Promise<{
    q?: string
    type?: ArtifactType
    sort?: string
    page?: string
}>

export default async function ArtifactsPage({ searchParams }: { searchParams: SearchParams }) {
    const { q, type, sort = "title_asc", page: pageParam } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)

    const conditions = [
        q ? ilike(artifacts.title, `%${q}%`) : undefined,
        type ? eq(artifacts.artifactType, type) : undefined,
    ].filter(Boolean) as Parameters<typeof and>

    const where = conditions.length ? and(...conditions) : undefined

    const orderBy =
        sort === "title_desc"
            ? desc(artifacts.title)
            : sort === "date_desc"
              ? desc(artifacts.createdAt)
              : sort === "date_asc"
                ? asc(artifacts.createdAt)
                : asc(artifacts.title)

    const [rows, [{ total }]] = await Promise.all([
        db
            .select({
                entityId: entities.id,
                code: artifacts.code,
                title: artifacts.title,
                artifactType: artifacts.artifactType,
            })
            .from(entities)
            .innerJoin(artifacts, eq(entities.artifactId, artifacts.id))
            .where(where)
            .orderBy(orderBy)
            .limit(PAGE_SIZE)
            .offset((page - 1) * PAGE_SIZE),
        db
            .select({ total: count() })
            .from(entities)
            .innerJoin(artifacts, eq(entities.artifactId, artifacts.id))
            .where(where),
    ])

    const entityIds = rows.map((r) => r.entityId)
    const topicRows = entityIds.length
        ? await db
              .select({ entityId: entityTopics.entityId, title: topics.title })
              .from(entityTopics)
              .innerJoin(topics, eq(topics.id, entityTopics.topicId))
              .where(inArray(entityTopics.entityId, entityIds))
        : []

    const topicsMap = new Map<number, string[]>()
    for (const { entityId, title } of topicRows) {
        if (!topicsMap.has(entityId)) topicsMap.set(entityId, [])
        topicsMap.get(entityId)!.push(title)
    }

    const totalPages = Math.ceil(total / PAGE_SIZE)
    const pageTitle = type ? TYPE_TITLES[type] : "Исторические объекты"
    const addHref = type ? `/admin/artifacts/new?type=${type}` : "/admin/artifacts/new"

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl font-bold">{pageTitle}</h1>
                <Link
                    href={addHref}
                    className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
                >
                    + Добавить
                </Link>
            </div>
            <p className="text-xs text-gray-400 mb-5">{total} всего</p>
            <Suspense>
                <AdminFilters q={q ?? ""} sort={sort} />
            </Suspense>
            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">Ничего не найдено.</p>
            ) : (
                <>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {rows.map((row) => (
                            <Link
                                key={row.entityId}
                                href={`/admin/artifacts/${row.code}`}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-sm font-medium flex-1 min-w-0 truncate">
                                    {row.title}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {topicsMap.get(row.entityId)?.map((t) => (
                                        <span
                                            key={t}
                                            className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                                        >
                                            {t}
                                        </span>
                                    ))}
                                </div>

                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                                    {TYPE_LABEL[row.artifactType]}
                                </span>
                            </Link>
                        ))}
                    </div>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        searchParams={{ q, type, sort }}
                    />
                </>
            )}
        </div>
    )
}
