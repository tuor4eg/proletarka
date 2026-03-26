"use client"

import Link from "next/link"
import { useState, useRef } from "react"
import { type InferSelectModel } from "drizzle-orm"
import { artifacts, materials } from "@/db/schema"

type Artifact = InferSelectModel<typeof artifacts>
type Material = Pick<
    InferSelectModel<typeof materials>,
    "id" | "title" | "summary" | "content" | "materialType" | "coverImagePath" | "yearFrom" | "yearTo"
>

type Props = {
    artifact: Artifact
    materials: Material[]
    code: string
}

export function ArtifactShowcaseView({ artifact, materials, code }: Props) {
    const photos = materials.filter((m) => m.materialType === "photo" && m.coverImagePath)

    const [current, setCurrent] = useState(0)
    const touchStartX = useRef<number | null>(null)

    const prev = () => setCurrent((i) => (i - 1 + photos.length) % photos.length)
    const next = () => setCurrent((i) => (i + 1) % photos.length)

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return
        const diff = touchStartX.current - e.changedTouches[0].clientX
        if (Math.abs(diff) > 40) diff > 0 ? next() : prev()
        touchStartX.current = null
    }

    return (
        <section className="border-t border-paper-border pt-8 my-8 lg:border-t-0 lg:pt-6">
            {photos.length > 0 && (
                <div
                    className="relative w-full rounded-2xl overflow-hidden bg-paper-dark select-none"
                    style={{ aspectRatio: "4/3" }}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    <img
                        key={photos[current].id}
                        src={photos[current].coverImagePath!}
                        alt={photos[current].title}
                        className="w-full h-full object-cover"
                    />

                    {/* Стрелки — только на десктопе */}
                    {photos.length > 1 && (
                        <>
                            <button
                                onClick={prev}
                                className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                            >
                                ‹
                            </button>
                            <button
                                onClick={next}
                                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                            >
                                ›
                            </button>
                        </>
                    )}

                    {/* Точки */}
                    {photos.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                            {photos.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                        i === current ? "bg-white" : "bg-white/40"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="mt-4">
                <p className="text-xs tracking-widest text-ink-muted uppercase mb-1">Памятник</p>
                <h2 className="text-base font-semibold text-ink">{artifact.title}</h2>
                {artifact.description && (
                    <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
                        {artifact.description}
                    </p>
                )}
                <Link
                    href={`/artifacts/${code}`}
                    className="inline-block mt-3 text-xs text-sepia hover:text-ink transition-colors"
                >
                    Подробнее →
                </Link>
            </div>
        </section>
    )
}
