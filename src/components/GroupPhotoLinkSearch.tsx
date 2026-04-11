"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"

type SearchResult = {
    id: number
    title: string
    status: "draft" | "published"
    linkedPeople: string[]
}

type Props = {
    personId: number
    action: (formData: FormData) => void | Promise<void>
}

const STATUS_LABEL = {
    draft: "Черновик",
    published: "Опубл.",
} as const

export function GroupPhotoLinkSearch({ personId, action }: Props) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [searching, setSearching] = useState(false)

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([])
            setSearching(false)
            return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(async () => {
            setSearching(true)
            try {
                const params = new URLSearchParams({
                    q: query.trim(),
                    excludePersonId: String(personId),
                })
                const res = await fetch(`/api/admin/group-photos/search?${params}`, {
                    signal: controller.signal,
                })
                if (!res.ok) {
                    setResults([])
                    return
                }
                const data = (await res.json()) as SearchResult[]
                setResults(data)
            } catch {
                setResults([])
            } finally {
                setSearching(false)
            }
        }, 250)

        return () => {
            controller.abort()
            clearTimeout(timeoutId)
        }
    }, [personId, query])

    return (
        <div className="border border-dashed border-gray-300 rounded-xl p-4 mb-4">
            <p className="text-sm font-medium mb-3">Привязать существующее групповое фото</p>
            <div className="relative">
                <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Поиск по названию и людям на фото…"
                    className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
            </div>
            {query.trim().length < 2 && (
                <p className="text-xs text-gray-400 mt-2">Введите хотя бы 2 символа для поиска.</p>
            )}
            {searching && <p className="text-xs text-gray-400 mt-2">Поиск…</p>}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
                <p className="text-xs text-gray-400 mt-2">Ничего не найдено.</p>
            )}
            {results.length > 0 && (
                <div className="mt-2 divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                    {results.map((result) => (
                        <div key={result.id} className="flex items-center gap-2 px-3 py-2.5">
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium truncate block">
                                    {result.title}
                                </span>
                                {result.linkedPeople.length > 0 && (
                                    <span className="text-xs text-gray-400">
                                        {result.linkedPeople.join(", ")}
                                    </span>
                                )}
                            </div>
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                                    result.status === "published"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                {STATUS_LABEL[result.status]}
                            </span>
                            <form action={action}>
                                <input type="hidden" name="materialId" value={result.id} />
                                <button
                                    type="submit"
                                    className="text-xs bg-black text-white rounded-lg px-2.5 py-1 hover:bg-gray-800 transition-colors shrink-0"
                                >
                                    Привязать
                                </button>
                            </form>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
