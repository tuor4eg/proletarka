"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, FileText } from "lucide-react"
import { Lightbox } from "@/components/Lightbox"

type Material = {
    id: number
    title: string
    summary: string | null
    content: string | null
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
    return <span className="text-xs text-ink-muted">{label}</span>
}

function ArticleList({ items }: { items: Material[] }) {
    if (items.length === 0) return <p className="text-sm text-ink-muted">Нет статей.</p>
    return (
        <div className="flex flex-col divide-y divide-paper-border">
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
                    {item.summary && <p className="text-sm text-ink-muted">{item.summary}</p>}
                </Link>
            ))}
        </div>
    )
}

function DocumentModal({ item, onClose }: { item: Material; onClose: () => void }) {
    useEffect(() => {
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = ""
        }
    }, [])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    const yearLabel = item.yearFrom
        ? item.yearFrom === item.yearTo || !item.yearTo
            ? String(item.yearFrom)
            : `${item.yearFrom}–${item.yearTo}`
        : null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 p-4"
            onClick={onClose}
        >
            <div
                className="bg-paper rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-3 p-5 border-b border-paper-border">
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold leading-snug">{item.title}</p>
                        {yearLabel && <p className="text-xs text-ink-muted mt-0.5">{yearLabel}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 p-1.5 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-paper-dark transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="overflow-y-auto p-5">
                    {item.summary && (
                        <p className="text-sm text-ink-muted mb-4 italic">{item.summary}</p>
                    )}
                    <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                        {item.content}
                    </p>
                </div>
            </div>
        </div>
    )
}

function DocumentGrid({
    items,
    onOpen,
    onRead,
}: {
    items: Material[]
    onOpen: (index: number) => void
    onRead: (item: Material) => void
}) {
    if (items.length === 0) return <p className="text-sm text-ink-muted">Нет документов.</p>
    const lightboxItems = items.filter((m) => m.coverImagePath)
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => {
                const lbIndex = lightboxItems.findIndex((m) => m.id === item.id)
                return (
                    <div key={item.id} className="flex flex-col gap-1 group">
                        <div
                            className={`aspect-square bg-paper-dark rounded-xl overflow-hidden flex items-center justify-center ${lbIndex !== -1 ? "cursor-zoom-in" : ""}`}
                            onClick={() => lbIndex !== -1 && onOpen(lbIndex)}
                        >
                            {item.coverImagePath ? (
                                <img
                                    src={item.coverImagePath}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <FileText size={36} className="text-ink-muted" />
                            )}
                        </div>
                        <p className="text-xs text-ink-secondary leading-tight">{item.title}</p>
                        <YearRange yearFrom={item.yearFrom} yearTo={item.yearTo} />
                        {item.content && (
                            <button
                                onClick={() => onRead(item)}
                                className="mt-0.5 self-start text-xs text-ink-muted hover:text-ink underline underline-offset-2 transition-colors"
                            >
                                Читать
                            </button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function PhotoGrid({ items, onOpen }: { items: Material[]; onOpen: (index: number) => void }) {
    if (items.length === 0) return <p className="text-sm text-ink-muted">Нет фотографий.</p>
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
                            className={`aspect-square bg-paper-dark rounded-xl overflow-hidden ${item.coverImagePath ? "cursor-zoom-in" : ""}`}
                        >
                            {item.coverImagePath ? (
                                <img
                                    src={item.coverImagePath}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
                                    нет фото
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-ink-secondary leading-tight">{item.title}</p>
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
    const [docLightboxIndex, setDocLightboxIndex] = useState<number | null>(null)
    const [docModal, setDocModal] = useState<Material | null>(null)

    const docPhotos = documents.filter((d) => d.coverImagePath)

    if (tabs.length === 0) {
        return <p className="text-sm text-ink-muted mt-6">Материалов пока нет.</p>
    }

    return (
        <div className="mt-8">
            <div className="flex border-b border-paper-border mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            activeTab === tab.key
                                ? "border-ink text-ink"
                                : "border-transparent text-ink-muted hover:text-ink-secondary"
                        }`}
                    >
                        {tab.label}{" "}
                        <span
                            className={`text-xs ${activeTab === tab.key ? "text-ink-muted" : "text-ink-muted"}`}
                        >
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {activeTab === "articles" && <ArticleList items={articles} />}
            {activeTab === "photos" && <PhotoGrid items={photos} onOpen={setLightboxIndex} />}
            {activeTab === "documents" && (
                <DocumentGrid items={documents} onOpen={setDocLightboxIndex} onRead={setDocModal} />
            )}

            {lightboxIndex !== null && (
                <Lightbox
                    items={photos
                        .filter((p) => p.coverImagePath)
                        .map((p) => ({ ...p, coverImagePath: p.coverImagePath! }))}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}

            {docLightboxIndex !== null && (
                <Lightbox
                    items={docPhotos.map((p) => ({ ...p, coverImagePath: p.coverImagePath! }))}
                    index={docLightboxIndex}
                    onClose={() => setDocLightboxIndex(null)}
                    onNavigate={setDocLightboxIndex}
                />
            )}

            {docModal !== null && (
                <DocumentModal item={docModal} onClose={() => setDocModal(null)} />
            )}
        </div>
    )
}
