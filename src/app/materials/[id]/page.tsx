import { db } from "@/db"
import { materials } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { BackButton } from "@/components/BackButton"
import { PageHero } from "@/components/PageHero"
import { CoverImage } from "@/components/CoverImage"
import { formatMaterialDate } from "@/lib/materialPresentation"

type Props = {
    params: Promise<{ id: string }>
}

export default async function MaterialPage({ params }: Props) {
    const { id } = await params
    const numericId = Number(id)

    if (!Number.isInteger(numericId) || numericId <= 0) {
        notFound()
    }

    const [material] = await db.select().from(materials).where(eq(materials.id, numericId)).limit(1)

    if (!material || material.status !== "published") {
        notFound()
    }

    const { title, yearFrom, yearTo, content, sourceUrl, coverImagePath, materialType, createdAt } =
        material

    const yearLabel = yearFrom && yearTo ? `${yearFrom}–${yearTo}` : yearFrom ? `${yearFrom}` : null
    const metaLabel = materialType === "news" ? formatMaterialDate(createdAt) : yearLabel

    return (
        <>
            <PageHero title={title} />
            <main className="max-w-lg mx-auto px-4 py-6">
                <div className="mb-6">
                    <BackButton />
                </div>
                {metaLabel && <p className="text-sm text-ink-muted mb-2">{metaLabel}</p>}
                {coverImagePath && <CoverImage src={coverImagePath} alt={title} />}
                {content && (
                    <div className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                        {content}
                    </div>
                )}
                {sourceUrl && (
                    <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-block text-sm text-sepia hover:underline"
                    >
                        Источник →
                    </a>
                )}
            </main>
        </>
    )
}
