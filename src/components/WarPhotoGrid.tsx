"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

type WarPhoto = {
    id: number
    title: string
    coverImagePath: string | null
    yearFrom: number | null
    yearTo: number | null
}

function yearLabel(photo: WarPhoto): string | null {
    if (!photo.yearFrom) return null
    if (!photo.yearTo || photo.yearFrom === photo.yearTo) return String(photo.yearFrom)
    return `${photo.yearFrom}–${photo.yearTo}`
}

function Lightbox({
    photos,
    index,
    onClose,
    onNavigate,
}: {
    photos: WarPhoto[]
    index: number
    onClose: () => void
    onNavigate: (i: number) => void
}) {
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

    const year = yearLabel(photo)

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={onClose}
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
                <X size={20} />
            </button>

            {photos.length > 1 && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/40 text-xs tabular-nums">
                    {index + 1} / {photos.length}
                </div>
            )}

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    prev()
                }}
                className={`absolute left-3 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all ${!hasPrev ? "opacity-0 pointer-events-none" : ""}`}
            >
                <ChevronLeft size={28} />
            </button>

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
                    {year && <p className="text-white/40 text-xs mt-0.5">{year}</p>}
                </div>
            </div>

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

export function WarPhotoGrid({ photos }: { photos: WarPhoto[] }) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const withImage = photos.filter((p) => p.coverImagePath)

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo) => {
                    const lbIndex = withImage.findIndex((p) => p.id === photo.id)
                    const year = yearLabel(photo)
                    return (
                        <div
                            key={photo.id}
                            className="flex flex-col gap-1 group"
                            onClick={() => lbIndex !== -1 && setLightboxIndex(lbIndex)}
                        >
                            <div
                                className={`aspect-square bg-paper-dark rounded-xl overflow-hidden ${photo.coverImagePath ? "cursor-zoom-in" : ""}`}
                            >
                                {photo.coverImagePath ? (
                                    <img
                                        src={photo.coverImagePath}
                                        alt={photo.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-ink-muted text-xs">
                                        нет фото
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-ink-secondary leading-tight">
                                {photo.title}
                            </p>
                            {year && <p className="text-xs text-ink-muted">{year}</p>}
                        </div>
                    )
                })}
            </div>

            {lightboxIndex !== null && (
                <Lightbox
                    photos={withImage}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
            )}
        </>
    )
}
