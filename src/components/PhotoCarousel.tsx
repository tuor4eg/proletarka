"use client"

import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Lightbox } from "@/components/Lightbox"

type Photo = {
    id: number
    title: string
    coverImagePath: string
    yearFrom: number | null
    yearTo: number | null
    content: string | null
    sourceUrl?: string | null
    personName?: string | null
    personCode?: string | null
}

type Props = {
    photos: Photo[]
}

export function PhotoCarousel({ photos }: Props) {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
    const [current, setCurrent] = useState(0)
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
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
    const yearLabel =
        photo.yearFrom && photo.yearTo
            ? `${photo.yearFrom}–${photo.yearTo}`
            : photo.yearFrom
              ? `${photo.yearFrom}`
              : null

    return (
        <>
            {lightboxIndex !== null && (
                <Lightbox
                    items={photos}
                    index={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onNavigate={setLightboxIndex}
                />
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
                                        onClick={() => setLightboxIndex(current)}
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
                    <p className="text-sm font-medium leading-snug">{photo.title}</p>
                    {yearLabel && <p className="text-xs text-ink-muted mt-0.5">{yearLabel}</p>}
                    {photo.personName && photo.personCode && (
                        <p className="text-xs text-ink-muted mt-0.5">
                            Из коллекции:{" "}
                            <Link
                                href={`/people/${photo.personCode}`}
                                className="hover:text-ink transition-colors underline underline-offset-2"
                            >
                                {photo.personName}
                            </Link>
                        </p>
                    )}
                    {photo.content &&
                        (() => {
                            const isLong = photo.content.length > 200
                            return (
                                <div className="mt-2">
                                    <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-wrap break-all">
                                        {isLong && !expanded
                                            ? photo.content.slice(0, 200) + "…"
                                            : photo.content}
                                    </p>
                                    {isLong && (
                                        <button
                                            onClick={() => setExpanded((v) => !v)}
                                            className="mt-1 text-xs text-ink-muted hover:text-ink transition-colors"
                                        >
                                            {expanded ? "Скрыть" : "Подробнее"}
                                        </button>
                                    )}
                                </div>
                            )
                        })()}
                    {photo.sourceUrl && (
                        <a
                            href={photo.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sepia hover:underline mt-1 inline-block"
                        >
                            Источник →
                        </a>
                    )}
                </div>
            </div>
        </>
    )
}
