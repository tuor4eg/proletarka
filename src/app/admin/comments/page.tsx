import Link from "next/link"
import { Suspense } from "react"
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm"
import { db } from "@/db"
import {
    comments,
    entities,
    people,
    artifacts,
    users,
    type CommentStatus,
    type EntityType,
} from "@/db/schema"
import { approveComment, hideComment, deleteComment } from "@/app/admin/comments/actions"
import { CommentsFilters } from "@/components/CommentsFilters"
import { Pagination } from "@/components/Pagination"

const PAGE_SIZE = 20

type SearchParams = Promise<{
    q?: string
    status?: CommentStatus
    targetType?: EntityType
    sort?: string
    page?: string
}>

function formatDate(date: Date) {
    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function statusBadgeClass(status: CommentStatus) {
    if (status === "approved") return "bg-green-100 text-green-700"
    if (status === "hidden") return "bg-gray-200 text-gray-700"
    return "bg-amber-100 text-amber-700"
}

function statusLabel(status: CommentStatus) {
    if (status === "approved") return "Опубликован"
    if (status === "hidden") return "Скрыт"
    return "На модерации"
}

export default async function AdminCommentsPage({ searchParams }: { searchParams: SearchParams }) {
    const { q, status, targetType, sort = "date_desc", page: pageParam } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)

    const baseConditions = [
        status ? eq(comments.status, status) : undefined,
        targetType ? eq(entities.type, targetType) : undefined,
        q
            ? or(
                  ilike(comments.body, `%${q}%`),
                  ilike(comments.author, `%${q}%`),
                  ilike(people.name, `%${q}%`),
                  ilike(artifacts.title, `%${q}%`),
              )
            : undefined,
    ].filter(Boolean) as Parameters<typeof and>

    const where = baseConditions.length > 0 ? and(...baseConditions) : undefined
    const orderBy = sort === "date_asc" ? asc(comments.createdAt) : desc(comments.createdAt)

    const [rows, [{ total }], allRows] = await Promise.all([
        db
            .select({
                id: comments.id,
                status: comments.status,
                author: comments.author,
                body: comments.body,
                createdAt: comments.createdAt,
                moderatedAt: comments.moderatedAt,
                entityId: entities.id,
                entityCode: entities.code,
                entityType: entities.type,
                personName: people.name,
                artifactTitle: artifacts.title,
                moderatorName: users.name,
            })
            .from(comments)
            .innerJoin(entities, eq(comments.entityId, entities.id))
            .leftJoin(people, eq(entities.personId, people.id))
            .leftJoin(artifacts, eq(entities.artifactId, artifacts.id))
            .leftJoin(users, eq(comments.moderatedBy, users.id))
            .where(where)
            .orderBy(orderBy)
            .limit(PAGE_SIZE)
            .offset((page - 1) * PAGE_SIZE),
        db
            .select({ total: count() })
            .from(comments)
            .innerJoin(entities, eq(comments.entityId, entities.id))
            .leftJoin(people, eq(entities.personId, people.id))
            .leftJoin(artifacts, eq(entities.artifactId, artifacts.id))
            .where(where),
        db.select({ status: comments.status }).from(comments),
    ])

    const totalPages = Math.ceil(total / PAGE_SIZE)
    const pendingCount = allRows.filter((row) => row.status === "pending").length
    const approvedCount = allRows.filter((row) => row.status === "approved").length
    const hiddenCount = allRows.filter((row) => row.status === "hidden").length

    return (
        <div className="py-6">
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-xl font-bold">Комментарии</h1>
            </div>
            <p className="text-xs text-gray-400 mb-5">
                {allRows.length} всего · {pendingCount} на модерации · {approvedCount} опубликовано
                · {hiddenCount} скрыто
            </p>

            <Suspense>
                <CommentsFilters
                    q={q ?? ""}
                    status={status ?? ""}
                    targetType={targetType ?? ""}
                    sort={sort}
                />
            </Suspense>

            {rows.length === 0 ? (
                <p className="text-sm text-ink-muted">Комментариев пока нет.</p>
            ) : (
                <>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {rows.map((row) => {
                            const targetTitle = row.personName ?? row.artifactTitle ?? "—"
                            const targetHref =
                                row.entityType === "person"
                                    ? `/people/${row.entityCode}`
                                    : `/artifacts/${row.entityCode}`

                            return (
                                <article key={row.id} className="px-4 py-4">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-ink">
                                                    {row.author ?? "Аноним"}
                                                </span>
                                                <span
                                                    className={`text-xs px-2 py-0.5 rounded-full ${statusBadgeClass(row.status)}`}
                                                >
                                                    {statusLabel(row.status)}
                                                </span>
                                                <span className="text-xs text-ink-muted">
                                                    {formatDate(row.createdAt)}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-xs text-ink-muted">
                                                <span>
                                                    {row.entityType === "person"
                                                        ? "Человек"
                                                        : "Объект"}
                                                    :{" "}
                                                </span>
                                                <Link
                                                    href={targetHref}
                                                    className="hover:underline underline-offset-2 text-ink-secondary"
                                                >
                                                    {targetTitle}
                                                </Link>
                                                {row.moderatedAt && row.moderatorName && (
                                                    <span> · модерировал {row.moderatorName}</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            {row.status !== "approved" && (
                                                <form action={approveComment.bind(null, row.id)}>
                                                    <button
                                                        type="submit"
                                                        className="text-xs px-2.5 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                                                    >
                                                        Одобрить
                                                    </button>
                                                </form>
                                            )}
                                            {row.status === "approved" && (
                                                <form action={hideComment.bind(null, row.id)}>
                                                    <button
                                                        type="submit"
                                                        className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                                    >
                                                        Скрыть
                                                    </button>
                                                </form>
                                            )}
                                            <form action={deleteComment.bind(null, row.id)}>
                                                <button
                                                    type="submit"
                                                    className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                                >
                                                    Удалить
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">
                                        {row.body}
                                    </p>
                                </article>
                            )
                        })}
                    </div>

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        searchParams={{ q, status, targetType, sort }}
                    />
                </>
            )}
        </div>
    )
}
