export const dynamic = 'force-dynamic'

import Link from "next/link"
import { db } from "@/db"
import { materials, entities, people } from "@/db/schema"
import { eq, desc, asc, and, ilike, count } from "drizzle-orm"
import { Suspense } from "react"
import { PublicNavWrapper } from "@/components/PublicNavWrapper"
import { PublicFilters } from "@/components/PublicFilters"
import { Pagination } from "@/components/Pagination"

const PAGE_SIZE = 12

const SORT_OPTIONS = [
    { value: "date_desc", label: "Новые сначала" },
    { value: "date_asc", label: "Старые сначала" },
    { value: "title_asc", label: "По названию А→Я" },
    { value: "title_desc", label: "По названию Я→А" },
]

type SearchParams = Promise<{ q?: string; sort?: string; page?: string }>

export default async function ArticlesPage({ searchParams }: { searchParams: SearchParams }) {
    const { q, sort = "date_desc", page: pageParam } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)

    const orderBy =
        sort === "date_asc"
            ? asc(materials.createdAt)
            : sort === "title_asc"
              ? asc(materials.title)
              : sort === "title_desc"
                ? desc(materials.title)
                : desc(materials.createdAt)

    const conditions = [
        eq(materials.status, "published"),
        eq(materials.materialType, "article"),
        q ? ilike(materials.title, `%${q}%`) : undefined,
    ].filter(Boolean) as Parameters<typeof and>

    const where = and(...conditions)

    const [articles, [{ total }]] = await Promise.all([
        db
            .select({
                id: materials.id,
                title: materials.title,
                summary: materials.summary,
                yearFrom: materials.yearFrom,
                yearTo: materials.yearTo,
                coverImagePath: materials.coverImagePath,
                personName: people.name,
                entityId: entities.id,
            })
            .from(materials)
            .leftJoin(entities, eq(materials.entityId, entities.id))
            .leftJoin(people, eq(entities.personId, people.id))
            .where(where)
            .orderBy(orderBy)
            .limit(PAGE_SIZE)
            .offset((page - 1) * PAGE_SIZE),
        db.select({ total: count() }).from(materials).where(where),
    ])

    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
        <>
            <PublicNavWrapper />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Статьи</h1>
                <Suspense>
                    <PublicFilters q={q ?? ""} sort={sort} sortOptions={SORT_OPTIONS} />
                </Suspense>
                {articles.length === 0 ? (
                    <p className="text-sm text-gray-500">Ничего не найдено.</p>
                ) : (
                    <>
                        <div className="flex flex-col divide-y divide-gray-100">
                            {articles.map((item) => (
                                <div
                                    key={item.id}
                                    className="relative py-5 hover:opacity-75 transition-opacity"
                                >
                                    <Link
                                        href={`/materials/${item.id}`}
                                        className="absolute inset-0"
                                        aria-label={item.title}
                                    />
                                    <div className="flex items-start gap-4">
                                        {item.coverImagePath && (
                                            <img
                                                src={item.coverImagePath}
                                                alt={item.title}
                                                className="w-20 h-20 object-cover rounded-xl shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-base font-semibold mb-1">
                                                {item.title}
                                            </h2>
                                            {item.summary && (
                                                <p className="text-sm text-gray-500 mb-2">
                                                    {item.summary}
                                                </p>
                                            )}
                                            <div className="relative z-10 flex items-center gap-3 text-xs text-gray-400">
                                                {item.personName && item.entityId && (
                                                    <a
                                                        href={`/people/${item.entityId}`}
                                                        className="hover:text-gray-700 transition-colors"
                                                    >
                                                        {item.personName}
                                                    </a>
                                                )}
                                                {(item.yearFrom || item.yearTo) && (
                                                    <span>
                                                        {item.yearFrom === item.yearTo ||
                                                        !item.yearTo
                                                            ? item.yearFrom
                                                            : `${item.yearFrom}–${item.yearTo}`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            searchParams={{ q, sort }}
                        />
                    </>
                )}
            </main>
        </>
    )
}
