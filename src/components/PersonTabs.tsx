"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

type Material = {
    id: number
    title: string
    summary: string | null
    coverImagePath: string | null
    yearFrom: number | null
    yearTo: number | null
    sourceUrl: string | null
}

type Props = {
    articles: Material[]
    photos: Material[]
    documents: Material[]
}

function YearRange({ yearFrom, yearTo }: { yearFrom: number | null; yearTo: number | null }) {
    if (!yearFrom && !yearTo) return null
    const label = yearFrom === yearTo || !yearTo ? String(yearFrom) : `${yearFrom}–${yearTo}`
    return <span className="text-xs text-gray-400">{label}</span>
}

function ArticleList({ items }: { items: Material[] }) {
    if (items.length === 0) return <p className="text-sm text-gray-400">Нет статей.</p>
    return (
        <div className="flex flex-col divide-y divide-gray-100">
            {items.map((item) => (
                <Link
                    key={item.id}
                    href={`/materials/${item.id}`}
                    className="py-4 block hover:opacity-70 transition-opacity"
                >
                    <div className="flex items-start gap-2 mb-1">
                        <span className="text-sm font-medium flex-1">{item.title}</span>
                        <YearRange yearFrom={item.yearFrom} yearTo={item.yearTo} />
                    </div>
                    {item.summary && <p className="text-sm text-gray-500">{item.summary}</p>}
                </Link>
            ))}
        </div>
    )
}

function DocumentList({ items }: { items: Material[] }) {
    if (items.length === 0) return <p className="text-sm text-gray-400">Нет документов.</p>
    return (
        <div className="flex flex-col divide-y divide-gray-100">
            {items.map((item) => (
                <Link
                    key={item.id}
                    href={`/materials/${item.id}`}
                    className="py-3 flex items-center gap-3 hover:opacity-70 transition-opacity"
                >
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.summary && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.summary}</p>
                        )}
                    </div>
                    <YearRange yearFrom={item.yearFrom} yearTo={item.yearTo} />
                </Link>
            ))}
        </div>
    )
}

type LightboxProps = {
    photos: Material[]
    index: number
    onClose: () => void
    onNavigate: (index: number) => void
}

function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
    const photo = photos[index]
    const hasPrev = index > 0
    const hasNext = index < photos.length - 1

    const prev = useCallback(() => {
        if (hasPrev) onNavigate(index - 1)
    }, [hasPrev, index, onNavigate])
    const next = useCallback(() => {
        if (hasNext) onNavigate(index + 1)
    }, [hasNext, index, onNavigate])

    useEffect(() => {
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = ""
        }
    }, [])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prev()
            if (e.key === "ArrowRight") next()
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [prev, next, onClose])

    if (!photo) return null

    const yearLabel = photo.yearFrom
        ? photo.yearFrom === photo.yearTo || !photo.yearTo
            ? String(photo.yearFrom)
            : `${photo.yearFrom}–${photo.yearTo}`
        : null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={onClose}
        >
            {/* Close */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
                <X size={20} />
            </button>

            {/* Counter */}
            {photos.length > 1 && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/40 text-xs tabular-nums">
                    {index + 1} / {photos.length}
                </div>
            )}

            {/* Prev */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    prev()
                }}
                className={`absolute left-3 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all ${!hasPrev ? "opacity-0 pointer-events-none" : ""}`}
            >
                <ChevronLeft size={28} />
            </button>

            {/* Image + caption */}
            <div
                className="flex flex-col items-center gap-4 px-16 max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    key={photo.id}
                    src={photo.coverImagePath!}
                    alt={photo.title}
                    className="max-h-[78vh] max-w-full object-contain rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                />
                <div className="text-center">
                    <p className="text-white/90 text-sm font-medium">{photo.title}</p>
                    {yearLabel && <p className="text-white/40 text-xs mt-0.5">{yearLabel}</p>}
                </div>
            </div>

            {/* Next */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    next()
                }}
                className={`absolute right-3 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all ${!hasNext ? "opacity-0 pointer-events-none" : ""}`}
            >
                <ChevronRight size={28} />
            </button>
        </div>
    )
}

function PhotoGrid({ items, onOpen }: { items: Material[]; onOpen: (index: number) => void }) {
    if (items.length === 0) return <p className="text-sm text-gray-400">Нет фотографий.</p>
    const lightboxItems = items.filter((m) => m.coverImagePath)
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => {
                const lbIndex = lightboxItems.findIndex((m) => m.id === item.id)
                return (
                    <div
                        key={item.id}
                        className="flex flex-col gap-1 group"
                        onClick={() => lbIndex !== -1 && onOpen(lbIndex)}
                    >
                        <div
                            className={`aspect-square bg-gray-100 rounded-xl overflow-hidden ${item.coverImagePath ? "cursor-zoom-in" : ""}`}
                        >
                            {item.coverImagePath ? (
                                <img
                                    src={item.coverImagePath}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                                    нет фото
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 leading-tight">{item.title}</p>
                        <YearRange yearFrom={item.yearFrom} yearTo={item.yearTo} />
                    </div>
                )
            })}
        </div>
    )
}

export function PersonTabs({ articles, photos, documents }: Props) {
    const tabs = [
        { key: "articles", label: "Статьи", count: articles.length },
        { key: "photos", label: "Фото", count: photos.length },
        { key: "documents", label: "Документы", count: documents.length },
    ].filter((t) => t.count > 0)

    const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? "articles")
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

    if (tabs.length === 0) {
        return <p className="text-sm text-gray-400 mt-6">Материалов пока нет.</p>
    }

    return (
        <div className="mt-8">
            <div className="flex border-b border-gray-200 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            activeTab === tab.key
                                ? "border-gray-900 text-gray-900"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {tab.label}{" "}
                        <span
                            className={`text-xs ${activeTab === tab.key ? "text-gray-500" : "text-gray-400"}`}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {activeTab === "articles" && <ArticleList items={articles} />}
            {activeTab === "photos" && <PhotoGrid items={photos} onOpen={setLightboxIndex} />}
            {activeTab === "documents" && <DocumentList items={documents} />}

            {lightboxIndex !== null && (
                <Lightbox
                    photos={photos}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
        </div>
    )
}
