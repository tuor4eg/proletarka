"use client"

import { useEffect, useState } from "react"
import { Search, Plus, X } from "lucide-react"
import { inputClass } from "@/components/MaterialForm"

export type SourceInputItem = {
    label: string
    url: string
}

type SourceLabelOption = {
    label: string
}

type Props = {
    initialSources?: SourceInputItem[]
}

export function SourcesInput({ initialSources = [] }: Props) {
    const [items, setItems] = useState<SourceInputItem[]>(initialSources)
    const [label, setLabel] = useState("")
    const [url, setUrl] = useState("")
    const [results, setResults] = useState<SourceLabelOption[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedSuggestion, setSelectedSuggestion] = useState(false)

    useEffect(() => {
        const query = label.trim()
        if (query.length < 2) {
            setResults([])
            setSearching(false)
            return
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(async () => {
            setSearching(true)
            try {
                const params = new URLSearchParams({ q: query })
                const response = await fetch(`/api/admin/sources/search?${params}`, {
                    signal: controller.signal,
                })

                if (!response.ok) {
                    setResults([])
                    return
                }

                const data = (await response.json()) as SourceLabelOption[]
                setResults(data.filter((item) => item.label !== label.trim()))
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
    }, [label])

    function addSource() {
        const nextLabel = label.trim()
        const nextUrl = url.trim()

        if (!nextLabel || !nextUrl) return

        setItems((current) => [...current, { label: nextLabel, url: nextUrl }])
        setLabel("")
        setUrl("")
        setResults([])
        setSelectedSuggestion(false)
    }

    function removeSource(index: number) {
        setItems((current) => current.filter((_, currentIndex) => currentIndex !== index))
    }

    return (
        <div className="flex flex-col gap-3">
            {items.length > 0 && (
                <div className="flex flex-col gap-2">
                    {items.map((item, index) => (
                        <div
                            key={`${item.label}-${item.url}-${index}`}
                            className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                        >
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                                <p className="text-xs text-gray-500 break-all">{item.url}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeSource(index)}
                                className="shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                aria-label={`Удалить источник ${item.label}`}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid gap-2">
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => {
                            setLabel(e.target.value)
                            setSelectedSuggestion(false)
                        }}
                        placeholder="Название источника"
                        className={`${inputClass} pl-8`}
                    />
                </div>

                {label.trim().length >= 2 && (searching || results.length > 0) && (
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                        {searching ? (
                            <p className="px-3 py-2 text-sm text-gray-400">Поиск…</p>
                        ) : (
                            results.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => {
                                        setLabel(item.label)
                                        setResults([])
                                        setSelectedSuggestion(true)
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                                >
                                    {item.label}
                                </button>
                            ))
                        )}
                    </div>
                )}

                {label.trim().length >= 2 &&
                    !searching &&
                    results.length === 0 &&
                    !selectedSuggestion && (
                        <p className="px-1 text-xs text-gray-400">Ничего не найдено.</p>
                    )}

                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="URL"
                    className={inputClass}
                />

                <button
                    type="button"
                    onClick={addSource}
                    disabled={!label.trim() || !url.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus size={14} />
                    Добавить источник
                </button>
            </div>

            {items.map((item, index) => (
                <div key={`${item.label}-${item.url}-hidden-${index}`}>
                    <input type="hidden" name="sourceLabels" value={item.label} />
                    <input type="hidden" name="sourceUrls" value={item.url} />
                </div>
            ))}
        </div>
    )
}
