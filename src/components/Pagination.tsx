import Link from "next/link"

type Props = {
    page: number
    totalPages: number
    searchParams: Record<string, string | undefined>
}

function buildUrl(searchParams: Record<string, string | undefined>, page: number) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
        if (value && key !== "page") params.set(key, value)
    }
    if (page > 1) params.set("page", String(page))
    const qs = params.toString()
    return qs ? `?${qs}` : "?"
}

export function Pagination({ page, totalPages, searchParams }: Props) {
    if (totalPages <= 1) return null

    const prev = page - 1
    const next = page + 1

    return (
        <div className="flex items-center justify-center gap-1 mt-6">
            {page > 1 ? (
                <Link
                    href={buildUrl(searchParams, prev)}
                    className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                >
                    ←
                </Link>
            ) : (
                <span className="px-3 py-1.5 text-sm text-gray-300">←</span>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                    key={p}
                    href={buildUrl(searchParams, p)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        p === page ? "bg-black text-white" : "hover:bg-gray-100 text-gray-600"
                    }`}
                >
                    {p}
                </Link>
            ))}

            {page < totalPages ? (
                <Link
                    href={buildUrl(searchParams, next)}
                    className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                >
                    →
                </Link>
            ) : (
                <span className="px-3 py-1.5 text-sm text-gray-300">→</span>
            )}
        </div>
    )
}
