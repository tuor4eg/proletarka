"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useRef } from "react"
import { triggerNavigationStart } from "@/components/NavigationProgress"

type SortOption = { value: string; label: string }

type Props = {
    q: string
    sort: string
    sortOptions: SortOption[]
}

export function PublicFilters({ q, sort, sortOptions }: Props) {
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

    return (
        <div className="flex gap-2 mb-6">
            <input
                type="search"
                placeholder="Поиск..."
                defaultValue={q}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 rounded-xl border border-paper-border px-3 py-2 text-sm focus:outline-none focus:border-ink-muted"
            />
            <select
                defaultValue={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
                className="rounded-xl border border-paper-border px-3 py-2 text-sm focus:outline-none focus:border-ink-muted bg-paper"
            >
                {sortOptions.map(({ value, label }) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
        </div>
    )
}
