"use client"

import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"

type Photo = {
    id: number
    title: string
    coverImagePath: string
    yearFrom: number | null
    yearTo: number | null
    content: string | null
}

type Props = {
    photos: Photo[]
}

export function PhotoCarousel({ photos }: Props) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
    const [current, setCurrent] = useState(0)
    const [lightbox, setLightbox] = useState(false)
    const [expanded, setExpanded] = useState(false)

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

    useEffect(() => {
        if (!emblaApi) return
        emblaApi.on("select", () => {
            setCurrent(emblaApi.selectedScrollSnap())
            setExpanded(false)
        })
    }, [emblaApi])

    const photo = photos[current]
    const yearLabel = photo.yearFrom && photo.yearTo
        ? `${photo.yearFrom}–${photo.yearTo}`
        : photo.yearFrom ? `${photo.yearFrom}` : null

    return (
        <>
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={() => setLightbox(false)}
                >
                    <img
                        src={photo.coverImagePath}
                        alt={photo.title}
                        className="max-w-[95vw] max-h-[95vh] object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        type="button"
                        onClick={() => setLightbox(false)}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg transition-colors"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="flex flex-col gap-3">
                <div className="relative">
                    <div ref={emblaRef} className="overflow-hidden rounded-2xl">
                        <div className="flex">
                            {photos.map((p) => (
                                <div key={p.id} className="flex-none w-full">
                                    <img
                                        src={p.coverImagePath}
                                        alt={p.title}
                                        className="w-full aspect-[4/3] object-cover cursor-zoom-in"
                                        onClick={() => setLightbox(true)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={scrollPrev}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={scrollNext}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                {photos.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => emblaApi?.scrollTo(i)}
                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                            i === current ? "bg-white" : "bg-white/40"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="px-1">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-sm font-medium leading-snug">{photo.title}</p>
                            {yearLabel && <p className="text-xs text-ink-muted mt-0.5">{yearLabel}</p>}
                        </div>
                        {photo.content && (
                            <button
                                onClick={() => setExpanded((v) => !v)}
                                className="shrink-0 flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors mt-0.5"
                            >
                                {expanded ? "Скрыть" : "Подробнее"}
                                <ChevronDown
                                    size={14}
                                    className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                                />
                            </button>
                        )}
                    </div>
                    {expanded && photo.content && (
                        <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap break-all mt-2">
                            {photo.content}
                        </p>
                    )}
                </div>
            </div>
        </>
    )
}
