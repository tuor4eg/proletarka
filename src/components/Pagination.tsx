import Link from "next/link"

type Props = {
    page: number
    totalPages: number
    searchParams: Record<string, string | undefined>
}

const NEARBY_PAGES = 5

type PageItem = number | "ellipsis"

function buildUrl(searchParams: Record<string, string | undefined>, page: number) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
        if (value && key !== "page") params.set(key, value)
    }
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    return qs ? `?${qs}` : "?"
}

function leadingPages(start: number): PageItem[] {
    if (start <= 1) return []
    if (start === 2) return [1]
    if (start === 3) return [1, 2]
    return [1, "ellipsis"]
}

function trailingPages(end: number, totalPages: number): PageItem[] {
    if (end >= totalPages) return []
    if (end === totalPages - 1) return [totalPages]
    if (end === totalPages - 2) return [totalPages - 1, totalPages]
    return ["ellipsis", totalPages]
}

function getPageItems(page: number, totalPages: number): PageItem[] {
    if (totalPages <= NEARBY_PAGES + 2) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(NEARBY_PAGES / 2)
    let start = page - half
    let end = page + half

    if (start < 1) {
        end += 1 - start
        start = 1
    }
    if (end > totalPages) {
        start -= end - totalPages
        end = totalPages
    }

    start = Math.max(1, start)
    end = Math.min(totalPages, end)

    const windowPages = Array.from({ length: end - start + 1 }, (_, i) => start + i)
    return [...leadingPages(start), ...windowPages, ...trailingPages(end, totalPages)]
}

export function Pagination({ page, totalPages, searchParams }: Props) {
    if (totalPages <= 1) return null

    const prev = page - 1
    const next = page + 1
    const items = getPageItems(page, totalPages)

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 mt-6">
            {page > 1 ? (
                <Link
                    href={buildUrl(searchParams, prev)}
                    className="px-3 py-1.5 text-sm rounded-lg hover:bg-paper-dark transition-colors shrink-0"
                >
                    ←
                </Link>
            ) : (
                <span className="px-3 py-1.5 text-sm text-ink-muted shrink-0">←</span>
            )}

            {items.map((item, index) =>
                item === "ellipsis" ? (
                    <span
                        key={`ellipsis-${index}`}
                        className="px-2 py-1.5 text-sm text-ink-muted shrink-0"
                    >
                        …
                    </span>
                ) : (
                    <Link
                        key={item}
                        href={buildUrl(searchParams, item)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors shrink-0 ${
                            item === page
                                ? "bg-ink text-white"
                                : "hover:bg-paper-dark text-ink-secondary"
                        }`}
                    >
                        {item}
                    </Link>
                ),
            )}

            {page < totalPages ? (
                <Link
                    href={buildUrl(searchParams, next)}
                    className="px-3 py-1.5 text-sm rounded-lg hover:bg-paper-dark transition-colors shrink-0"
                >
                    →
                </Link>
            ) : (
                <span className="px-3 py-1.5 text-sm text-ink-muted shrink-0">→</span>
            )}
        </div>
    )
}
