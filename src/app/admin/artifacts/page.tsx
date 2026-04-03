import Link from "next/link"
import { eq, asc, desc, ilike, and, count } from "drizzle-orm"
import { db } from "@/db"
import { entities, artifacts, type ArtifactType } from "@/db/schema"
import { AdminFilters } from "@/components/AdminFilters"
import { Pagination } from "@/components/Pagination"
import { Suspense } from "react"

const TYPE_LABEL: Record<ArtifactType, string> = {
    general: "Объект",
    stand: "Стенд",
    rarity: "Экспонат",
    fund: "Фонд",
}

const ARTIFACT_TYPE_OPTIONS = [
    { value: "", label: "Все типы" },
    { value: "stand", label: "Стенд" },
    { value: "general", label: "Объект" },
    { value: "rarity", label: "Экспонат" },
    { value: "fund", label: "Фонд" },
]

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
                title: artifacts.title,
                yearsLabel: artifacts.yearsLabel,
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

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl font-bold">Исторические объекты</h1>
                <Link
                    href="/admin/artifacts/new"
                    className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
                >
                    + Добавить
                </Link>
            </div>
            <p className="text-xs text-gray-400 mb-5">{total} всего</p>
            <Suspense>
                <AdminFilters
                    q={q ?? ""}
                    sort={sort}
                    type={type ?? ""}
                    showType
                    typeOptions={ARTIFACT_TYPE_OPTIONS}
                />
            </Suspense>
            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">Ничего не найдено.</p>
            ) : (
                <>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {rows.map((row) => (
                            <Link
                                key={row.entityId}
                                href={`/admin/artifacts/${row.entityId}`}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-sm font-medium flex-1 min-w-0 truncate">{row.title}</span>
                                {row.yearsLabel && (
                                    <span className="text-xs text-gray-400 shrink-0">{row.yearsLabel}</span>
                                )}
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
