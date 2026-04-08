import Link from "next/link"
import { getApprovedCommentsByEntityId, type CommentsSort } from "@/app/comments/queries"
import { CommentForm } from "@/components/comments/CommentForm"
import { Pagination } from "@/components/Pagination"

const PAGE_SIZE = 10

function formatCommentDate(date: Date) {
    return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}

export async function CommentsSection({
    entityId,
    page = 1,
    sort = "date_desc",
}: {
    entityId: number
    page?: number
    sort?: CommentsSort
}) {
    const { items, total } = await getApprovedCommentsByEntityId(entityId, {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        sort,
    })
    const totalPages = Math.ceil(total / PAGE_SIZE)

    return (
        <section className="mt-12 pt-6 border-t border-paper-border">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-ink">Отклики и воспоминания</h2>
                <div className="flex items-center gap-1 rounded-xl border border-paper-border bg-white/60 p-1">
                    <Link
                        href={sort === "date_desc" ? "?" : "?sort=date_desc"}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                            sort === "date_desc"
                                ? "bg-paper-dark text-ink"
                                : "text-ink-muted hover:text-ink"
                        }`}
                    >
                        Новые
                    </Link>
                    <Link
                        href={sort === "date_asc" ? "?sort=date_asc" : "?sort=date_asc"}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                            sort === "date_asc"
                                ? "bg-paper-dark text-ink"
                                : "text-ink-muted hover:text-ink"
                        }`}
                    >
                        Старые
                    </Link>
                </div>
            </div>

            {items.length === 0 ? (
                <p className="text-sm text-ink-muted mb-8">
                    Пока комментариев нет. Вы можете оставить первый отклик.
                </p>
            ) : (
                <div className="mb-8 flex flex-col divide-y divide-paper-border rounded-2xl border border-paper-border bg-white/60 overflow-hidden">
                    {items.map((item) => (
                        <article key={item.id} className="px-4 py-4">
                            <div className="flex items-baseline justify-between gap-4 mb-2">
                                <p className="text-sm font-medium text-ink">
                                    {item.author ?? "Аноним"}
                                </p>
                                <time className="text-xs text-ink-muted shrink-0">
                                    {formatCommentDate(item.createdAt)}
                                </time>
                            </div>
                            <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap">
                                {item.body}
                            </p>
                        </article>
                    ))}
                </div>
            )}

            <Pagination page={page} totalPages={totalPages} searchParams={{ sort }} />

            <CommentForm entityId={entityId} />
        </section>
    )
}
