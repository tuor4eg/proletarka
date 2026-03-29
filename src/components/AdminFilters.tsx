"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { triggerNavigationStart } from "@/components/NavigationProgress"

const STATUSES = [
    { value: "", label: "Все статусы" },
    { value: "draft", label: "Черновик" },
    { value: "published", label: "Опубликовано" },
]

const TYPES = [
    { value: "", label: "Все типы" },
    { value: "article", label: "Статья" },
    { value: "photo", label: "Фото" },
    { value: "document", label: "Документ" },
]

const SORTS_DATE_TITLE = [
    { value: "date_desc", label: "Новые сначала" },
    { value: "date_asc", label: "Старые сначала" },
    { value: "title_asc", label: "По названию А→Я" },
    { value: "title_desc", label: "По названию Я→А" },
]

const SORTS_TITLE_ONLY = [
    { value: "title_asc", label: "По названию А→Я" },
    { value: "title_desc", label: "По названию Я→А" },
    { value: "date_desc", label: "Новые сначала" },
    { value: "date_asc", label: "Старые сначала" },
]

const selectClass =
    "rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"

type Props = {
    q: string
    sort: string
    status?: string
    type?: string
    showStatus?: boolean
    showType?: boolean
    typeOptions?: { value: string; label: string }[]
    sortOptions?: "date_title" | "title_only"
}

export function AdminFilters({
    q,
    sort,
    status = "",
    type = "",
    showStatus = false,
    showType = false,
    typeOptions,
    sortOptions = "date_title",
}: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

    function updateParam(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (value) params.set(key, value)
        else params.delete(key)
        triggerNavigationStart()
        router.push(`${pathname}?${params.toString()}`)
    }

    function handleSearch(value: string) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => updateParam("q", value), 400)
    }

    const sorts = sortOptions === "title_only" ? SORTS_TITLE_ONLY : SORTS_DATE_TITLE

    return (
        <div className="flex gap-2 mb-4">
            <input
                type="search"
                placeholder="Поиск..."
                defaultValue={q}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
            {showStatus && (
                <select
                    defaultValue={status}
                    onChange={(e) => updateParam("status", e.target.value)}
                    className={selectClass}
                >
                    {STATUSES.map(({ value, label }) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            )}
            {showType && (
                <select
                    defaultValue={type}
                    onChange={(e) => updateParam("type", e.target.value)}
                    className={selectClass}
                >
                    {(typeOptions ?? TYPES).map(({ value, label }) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            )}
            <select
                defaultValue={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
                className={selectClass}
            >
                {sorts.map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
        </div>
    )
}
