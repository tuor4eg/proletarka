"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trash2, Search } from "lucide-react"
import {
    linkMaterial,
    unlinkMaterial,
    updateLinkedMaterialSection,
} from "@/app/admin/artifacts/actions"
import type { MaterialType, Status } from "@/db/schema"
import type { SectionOption } from "@/components/SortableMaterialsList"

const TYPE_LABEL: Record<MaterialType, string> = {
    article: "Статья",
    news: "Новость",
    photo: "Фото",
    document: "Документ",
}

const STATUS_LABEL: Record<Status, string> = { draft: "Черновик", published: "Опубл." }

export type LinkedArtifactMaterial = {
    materialId: number
    title: string
    materialType: MaterialType
    status: Status
    sectionId: number | null
    personName: string | null
    personCode: string | null
}

type SearchResult = {
    id: number
    title: string
    materialType: MaterialType
    personName: string | null
    artifactTitle: string | null
}

type Props = {
    artifactId: number
    linkedMaterials: LinkedArtifactMaterial[]
    sections: SectionOption[]
    isStand: boolean
}

export function LinkedArtifactMaterialsBlock({
    artifactId,
    linkedMaterials,
    sections,
    isStand,
}: Props) {
    const router = useRouter()
    const [query, setQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedSections, setSelectedSections] = useState<Record<number, number | null>>({})

    async function search(q: string, type: string) {
        if (q.length < 2) {
            setResults([])
            return
        }
        setSearching(true)
        const params = new URLSearchParams({ q, excludeArtifactId: String(artifactId) })
        if (type) params.set("type", type)
        const res = await fetch(`/api/admin/materials/search?${params}`)
        const data = await res.json()
        setResults(data)
        setSearching(false)
    }

    function handleQueryChange(q: string) {
        setQuery(q)
        search(q, typeFilter)
    }

    function handleTypeChange(type: string) {
        setTypeFilter(type)
        search(query, type)
    }

    return (
        <div className="mt-10 mb-16">
            <h2 className="text-base font-semibold mb-3">Ссылочные материалы</h2>

            {linkedMaterials.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 mb-4">
                    {linkedMaterials.map((m) => (
                        <div key={m.materialId} className="flex items-center gap-2 px-4 py-2.5">
                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/admin/${m.materialId}`}
                                    className="text-sm font-medium truncate block hover:underline"
                                >
                                    {m.title}
                                </Link>
                                {m.personName && (
                                    <span className="text-xs text-gray-400">
                                        из коллекции:{" "}
                                        {m.personCode ? (
                                            <Link
                                                href={`/admin/people/${m.personCode}`}
                                                className="hover:text-gray-700 transition-colors"
                                            >
                                                {m.personName}
                                            </Link>
                                        ) : (
                                            m.personName
                                        )}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">
                                {TYPE_LABEL[m.materialType]}
                            </span>
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${m.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                            >
                                {STATUS_LABEL[m.status]}
                            </span>
                            {isStand && sections.length > 0 && (
                                <select
                                    defaultValue={m.sectionId ?? ""}
                                    onChange={async (e) => {
                                        const sectionId = e.target.value
                                            ? Number(e.target.value)
                                            : null
                                        await updateLinkedMaterialSection(
                                            artifactId,
                                            m.materialId,
                                            sectionId,
                                        )
                                        router.refresh()
                                    }}
                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-gray-400 shrink-0"
                                >
                                    <option value="">Без раздела</option>
                                    {sections.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.title}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <form action={unlinkMaterial.bind(null, artifactId, m.materialId)}>
                                <button
                                    type="submit"
                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </form>
                        </div>
                    ))}
                </div>
            )}

            {linkedMaterials.length === 0 && (
                <p className="text-sm text-gray-400 mb-4">Ссылочных материалов пока нет.</p>
            )}

            <div className="border border-dashed border-gray-300 rounded-xl p-4">
                <p className="text-sm font-medium mb-3">Привязать существующий материал</p>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            placeholder="Поиск по названию, персоне…"
                            className="w-full rounded-xl border border-gray-200 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 shrink-0"
                    >
                        <option value="">Все типы</option>
                        <option value="photo">Фото</option>
                        <option value="article">Статья</option>
                        <option value="news">Новость</option>
                        <option value="document">Документ</option>
                    </select>
                </div>
                {searching && <p className="text-xs text-gray-400 mt-2">Поиск…</p>}
                {!searching && query.length >= 2 && results.length === 0 && (
                    <p className="text-xs text-gray-400 mt-2">Ничего не найдено.</p>
                )}
                {results.length > 0 && (
                    <div className="mt-2 divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                        {results.map((r) => (
                            <div key={r.id} className="flex items-center gap-2 px-3 py-2.5">
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium truncate block">
                                        {r.title}
                                    </span>
                                    {(r.personName ?? r.artifactTitle) && (
                                        <span className="text-xs text-gray-400">
                                            {r.personName ?? r.artifactTitle}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-400 shrink-0">
                                    {TYPE_LABEL[r.materialType]}
                                </span>
                                {isStand && sections.length > 0 && (
                                    <select
                                        value={selectedSections[r.id] ?? ""}
                                        onChange={(e) =>
                                            setSelectedSections((prev) => ({
                                                ...prev,
                                                [r.id]: e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                            }))
                                        }
                                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-gray-400 shrink-0"
                                    >
                                        <option value="">Без раздела</option>
                                        {sections.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.title}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <form
                                    action={linkMaterial.bind(
                                        null,
                                        artifactId,
                                        r.id,
                                        selectedSections[r.id] ?? null,
                                    )}
                                >
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
        </div>
    )
}
