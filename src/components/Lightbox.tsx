"use client"

import { useCallback, useEffect, useState } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

export type LightboxItem = {
    id: number
    title: string
    coverImagePath: string
    yearFrom: number | null
    yearTo: number | null
}

type Props = {
    items: LightboxItem[]
    index: number
    onClose: () => void
    onNavigate: (index: number) => void
}

export function Lightbox({ items, index, onClose, onNavigate }: Props) {
    const item = items[index]
    const [portrait, setPortrait] = useState(false)

    useEffect(() => setPortrait(false), [item?.id])

    const hasPrev = index > 0
    const hasNext = index < items.length - 1

    const prev = useCallback(() => { if (hasPrev) onNavigate(index - 1) }, [hasPrev, index, onNavigate])
    const next = useCallback(() => { if (hasNext) onNavigate(index + 1) }, [hasNext, index, onNavigate])

    useEffect(() => {
        document.body.style.overflow = "hidden"
        return () => { document.body.style.overflow = "" }
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

    if (!item) return null

    const yearLabel = item.yearFrom
        ? item.yearFrom === item.yearTo || !item.yearTo
            ? String(item.yearFrom)
            : `${item.yearFrom}–${item.yearTo}`
        : null

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div className="sticky top-4 z-10 flex items-center justify-between px-4 pointer-events-none">
                {items.length > 1 ? (
                    <span className="text-white/40 text-xs tabular-nums pointer-events-auto">
                        {index + 1} / {items.length}
                    </span>
                ) : <span />}
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors pointer-events-auto"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex flex-col items-center min-h-screen justify-center py-12 px-16">
                <div
                    className="flex flex-col items-center gap-4 max-w-[90vw] w-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        key={item.id}
                        src={item.coverImagePath}
                        alt={item.title}
                        onLoad={(e) => {
                            const img = e.currentTarget
                            setPortrait(img.naturalHeight > img.naturalWidth)
                        }}
                        className={`object-contain rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
                            portrait
                                ? "max-w-[88vw] h-auto"
                                : "max-h-[80vh] w-auto"
                        }`}
                    />
                    <div className="text-center">
                        <p className="text-white/90 text-sm font-medium">{item.title}</p>
                        {yearLabel && <p className="text-white/40 text-xs mt-0.5">{yearLabel}</p>}
                    </div>
                    {items.length > 1 && (
                        <div className="flex gap-4 mt-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); prev() }}
                                className={`p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all ${!hasPrev ? "opacity-0 pointer-events-none" : ""}`}
                            >
                                <ChevronLeft size={28} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); next() }}
                                className={`p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all ${!hasNext ? "opacity-0 pointer-events-none" : ""}`}
                            >
                                <ChevronRight size={28} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
