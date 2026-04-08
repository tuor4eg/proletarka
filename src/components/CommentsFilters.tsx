"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { triggerNavigationStart } from "@/components/NavigationProgress"

const STATUSES = [
    { value: "", label: "Все статусы" },
    { value: "pending", label: "На модерации" },
    { value: "approved", label: "Опубликовано" },
    { value: "hidden", label: "Скрыто" },
]

const TARGET_TYPES = [
    { value: "", label: "Все страницы" },
    { value: "person", label: "Люди" },
    { value: "artifact", label: "Объекты" },
]

const SORTS = [
    { value: "date_desc", label: "Новые сначала" },
    { value: "date_asc", label: "Старые сначала" },
]

const selectClass =
    "rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"

type Props = {
    q: string
    status: string
    targetType: string
    sort: string
}

export function CommentsFilters({ q, status, targetType, sort }: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

    function updateParam(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("page")
        if (value) params.set(key, value)
        else params.delete(key)
        triggerNavigationStart()
        router.push(`${pathname}?${params.toString()}`)
    }

    function handleSearch(value: string) {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => updateParam("q", value), 400)
    }

    return (
        <div className="flex gap-2 mb-4 flex-wrap">
            <input
                type="search"
                placeholder="Поиск по тексту, автору, странице..."
                defaultValue={q}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 min-w-[240px] rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
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
            <select
                defaultValue={targetType}
                onChange={(e) => updateParam("targetType", e.target.value)}
                className={selectClass}
            >
                {TARGET_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
            <select
                defaultValue={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
                className={selectClass}
            >
                {SORTS.map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
        </div>
    )
}
