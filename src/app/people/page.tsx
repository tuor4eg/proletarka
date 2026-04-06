export const dynamic = "force-dynamic"

import Link from "next/link"
import { User } from "lucide-react"
import { db } from "@/db"
import { entities, people } from "@/db/schema"
import { eq, asc, desc, ilike, and, sql, count } from "drizzle-orm"
import { fetchFirstPhotoMap } from "@/db/queries"
import { Suspense } from "react"
import { PageHero } from "@/components/PageHero"
import { PublicFilters } from "@/components/PublicFilters"
import { LetterFilter } from "@/components/LetterFilter"
import { Pagination } from "@/components/Pagination"
import type { SearchParams } from "@/lib/types"

const PAGE_SIZE = 20

const SORT_OPTIONS = [
    { value: "title_asc", label: "По имени А→Я" },
    { value: "title_desc", label: "По имени Я→А" },
    { value: "date_desc", label: "Новые сначала" },
    { value: "date_asc", label: "Старые сначала" },
]

function formatYears(
    birthYear: number | null,
    deathYear: number | null,
    yearsLabel: string | null,
) {
    if (birthYear || deathYear) {
        return `${birthYear ?? "?"}–${deathYear ?? "..."}`
    }
    return yearsLabel ?? null
}

export default async function PeoplePage({ searchParams }: { searchParams: SearchParams }) {
    const { q, sort = "title_asc", letter, page: pageParam } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)

    const orderBy =
        sort === "title_desc"
            ? desc(people.name)
            : sort === "date_desc"
              ? desc(entities.id)
              : sort === "date_asc"
                ? asc(entities.id)
                : asc(people.name)

    const conditions = [
        q ? ilike(people.name, `%${q}%`) : undefined,
        letter ? ilike(people.name, `${letter}%`) : undefined,
    ].filter(Boolean) as Parameters<typeof and>

    const where = conditions.length ? and(...conditions) : undefined

    const [rows, [{ total }], letterRows] = await Promise.all([
        db
            .select({
                entityId: entities.id,
                entityCode: people.code,
                name: people.name,
                birthYear: people.birthYear,
                deathYear: people.deathYear,
                yearsLabel: people.yearsLabel,
                mainPhotoPath: people.mainPhotoPath,
            })
            .from(entities)
            .innerJoin(people, eq(entities.personId, people.id))
            .where(where)
            .orderBy(orderBy)
            .limit(PAGE_SIZE)
            .offset((page - 1) * PAGE_SIZE),
        db
            .select({ total: count() })
            .from(entities)
            .innerJoin(people, eq(entities.personId, people.id))
            .where(where),
        db.selectDistinct({ letter: sql<string>`UPPER(LEFT(${people.name}, 1))` }).from(people),
    ])

    const totalPages = Math.ceil(total / PAGE_SIZE)
    const availableLetters = letterRows.map((r) => r.letter).filter(Boolean)

    const noPhotoIds = rows.filter((r) => !r.mainPhotoPath).map((r) => r.entityId)
    const fallbackMap = await fetchFirstPhotoMap(noPhotoIds)

    return (
        <>
            <PageHero title="Люди" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <LetterFilter availableLetters={availableLetters} />
                <Suspense>
                    <PublicFilters q={q ?? ""} sort={sort} sortOptions={SORT_OPTIONS} />
                </Suspense>
                {rows.length === 0 ? (
                    <p className="text-sm text-ink-muted">Ничего не найдено.</p>
                ) : (
                    <>
                        <div className="flex flex-col divide-y divide-paper-border">
                            {rows.map((row) => {
                                const years = formatYears(
                                    row.birthYear,
                                    row.deathYear,
                                    row.yearsLabel,
                                )
                                return (
                                    <Link
                                        key={row.entityId}
                                        href={`/people/${row.entityCode}`}
                                        className="flex items-center gap-3 py-3 hover:opacity-70 transition-opacity"
                                    >
                                        <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-paper-dark flex items-center justify-center">
                                            {(row.mainPhotoPath ??
                                            fallbackMap.get(row.entityId)) ? (
                                                <img
                                                    src={
                                                        (row.mainPhotoPath ??
                                                            fallbackMap.get(row.entityId))!
                                                    }
                                                    alt={row.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User size={18} className="text-ink-muted" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {row.name}
                                            </p>
                                            {years && (
                                                <p className="text-xs text-ink-muted">{years}</p>
                                            )}
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            searchParams={{ q, sort, letter }}
                        />
                    </>
                )}
            </main>
        </>
    )
}
