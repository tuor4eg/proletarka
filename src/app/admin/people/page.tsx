import Link from "next/link"
import { eq, ilike, asc, desc, and, sql, count } from "drizzle-orm"
import { Suspense } from "react"
import { db } from "@/db"
import { entities, people } from "@/db/schema"
import { AdminFilters } from "@/components/AdminFilters"
import { LetterFilter } from "@/components/LetterFilter"
import { Pagination } from "@/components/Pagination"
import type { SearchParams } from "@/lib/types"
import { buildBackstackHref, parseBackstack, pushBackstack } from "@/lib/adminBackstack"

const PAGE_SIZE = 20

export default async function PeoplePage({ searchParams }: { searchParams: SearchParams }) {
    const { q, sort = "title_asc", letter, page: pageParam, backstack } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)
    const currentParams = new URLSearchParams()
    const currentBackstack = parseBackstack(backstack)

    if (q) currentParams.set("q", q)
    if (sort) currentParams.set("sort", sort)
    if (letter) currentParams.set("letter", letter)
    if (page > 1) currentParams.set("page", String(page))

    const currentUrl = `/admin/people${currentParams.toString() ? `?${currentParams.toString()}` : ""}`
    const nextBackstack = pushBackstack(currentBackstack, currentUrl)

    const orderBy =
        sort === "title_desc"
            ? desc(people.name)
            : sort === "date_desc"
              ? desc(entities.id)
              : sort === "date_asc"
                ? asc(entities.id)
                : asc(people.name)

    const conditions = [
        eq(entities.type, "person"),
        q ? ilike(people.name, `%${q}%`) : undefined,
        letter ? ilike(people.name, `${letter}%`) : undefined,
    ].filter(Boolean) as Parameters<typeof and>

    const where = and(...conditions)

    const [rows, [{ total }], letterRows] = await Promise.all([
        db
            .select({ id: entities.id, code: people.code, personName: people.name })
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

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold">Картотека</h1>
                <Link
                    href="/admin/people/new"
                    className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
                >
                    + Добавить
                </Link>
            </div>
            <LetterFilter availableLetters={availableLetters} compact />
            <Suspense>
                <AdminFilters q={q ?? ""} sort={sort} sortOptions="title_only" />
            </Suspense>
            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">Ничего не найдено.</p>
            ) : (
                <>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {rows.map((row) => (
                            <Link
                                key={row.id}
                                href={buildBackstackHref(
                                    `/admin/people/${row.code}`,
                                    nextBackstack,
                                )}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                            >
                                <span className="text-sm font-medium flex-1">
                                    {row.personName ?? `#${row.id}`}
                                </span>
                                <span className="text-xs text-gray-400">Человек</span>
                            </Link>
                        ))}
                    </div>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        searchParams={{ q, sort, letter }}
                    />
                </>
            )}
        </div>
    )
}
