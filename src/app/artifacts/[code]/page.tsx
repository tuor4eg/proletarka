import { notFound } from "next/navigation"
import { eq, and, asc, sql } from "drizzle-orm"
import { db } from "@/db"
import { entities, artifacts, materials, artifactSections } from "@/db/schema"
import { PageHero } from "@/components/PageHero"
import { BackButton } from "@/components/BackButton"
import { MaterialCard } from "@/components/MaterialCard"
import { PhotoCarousel } from "@/components/PhotoCarousel"

type Props = {
    params: Promise<{ code: string }>
}

export default async function ArtifactPage({ params }: Props) {
    const { code } = await params

    const [row] = await db
        .select({ entity: entities, artifact: artifacts })
        .from(entities)
        .innerJoin(artifacts, eq(entities.artifactId, artifacts.id))
        .where(eq(entities.code, code))
        .limit(1)

    if (!row) notFound()

    const { artifact, entity } = row

    const [linkedMaterials, sections] = await Promise.all([
        db
            .select({
                id: materials.id,
                title: materials.title,
                summary: materials.summary,
                yearFrom: materials.yearFrom,
                yearTo: materials.yearTo,
                materialType: materials.materialType,
                coverImagePath: materials.coverImagePath,
                content: materials.content,
                sourceUrl: materials.sourceUrl,
                sectionId: materials.sectionId,
            })
            .from(materials)
            .where(and(eq(materials.entityId, entity.id), eq(materials.status, "published")))
            .orderBy(sql`${materials.position} ASC NULLS LAST`, asc(materials.id)),
        db
            .select()
            .from(artifactSections)
            .where(eq(artifactSections.artifactId, artifact.id))
            .orderBy(asc(artifactSections.position)),
    ])

    const isStand = artifact.artifactType === "stand"

    function renderMaterials(items: typeof linkedMaterials) {
        const photos = items.filter(
            (m) => m.materialType === "photo" && m.coverImagePath
        ) as (typeof items[number] & { coverImagePath: string })[]
        const others = items.filter((m) => m.materialType !== "photo")

        return (
            <>
                {photos.length > 0 && (
                    <div className="mb-6">
                        <PhotoCarousel photos={photos} />
                    </div>
                )}
                {others.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {others.map((m) => (
                            <MaterialCard
                                key={m.id}
                                material={{
                                    id: m.id,
                                    title: m.title,
                                    summary: m.summary,
                                    yearFrom: m.yearFrom,
                                    yearTo: m.yearTo,
                                    personName: null,
                                    topics: [],
                                }}
                            />
                        ))}
                    </div>
                )}
            </>
        )
    }

    return (
        <>
            <PageHero title={artifact.title} />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <BackButton />
                </div>
                <div className="mb-8">
                    {(artifact.yearFrom || artifact.yearsLabel) && (
                        <p className="text-sm text-ink-muted mt-1">
                            {artifact.yearFrom
                                ? artifact.yearTo
                                    ? `${artifact.yearFrom}–${artifact.yearTo}`
                                    : String(artifact.yearFrom)
                                : artifact.yearsLabel}
                        </p>
                    )}
                    {artifact.description && (
                        <p className="text-sm text-ink-secondary mt-3 leading-relaxed">
                            {artifact.description}
                        </p>
                    )}
                </div>

                {isStand && sections.length > 0 ? (
                    <div className="flex flex-col gap-10">
                        {sections.filter(s => linkedMaterials.some(m => m.sectionId === s.id)).length > 1 && (
                            <nav className="flex flex-wrap items-center gap-y-1">
                                {sections.filter(s => linkedMaterials.some(m => m.sectionId === s.id)).map((section, i, arr) => (
                                    <span key={section.id} className="flex items-center">
                                        <a
                                            href={`#section-${section.id}`}
                                            className="text-sm text-ink-muted hover:text-ink transition-colors"
                                        >
                                            {section.title}
                                        </a>
                                        {i < arr.length - 1 && (
                                            <span className="mx-2 text-ink-muted select-none">·</span>
                                        )}
                                    </span>
                                ))}
                            </nav>
                        )}
                        {sections.map((section) => {
                            const sectionMaterials = linkedMaterials.filter(m => m.sectionId === section.id)
                            if (sectionMaterials.length === 0) return null
                            return (
                                <div key={section.id} id={`section-${section.id}`}>
                                    <h2 className="text-base font-semibold mb-4 pb-2 border-b border-paper-border">
                                        {section.title}
                                    </h2>
                                    {renderMaterials(sectionMaterials)}
                                </div>
                            )
                        })}
                        {(() => {
                            const unsectioned = linkedMaterials.filter(m => !m.sectionId)
                            return unsectioned.length > 0 && renderMaterials(unsectioned)
                        })()}
                    </div>
                ) : (
                    renderMaterials(linkedMaterials)
                )}
            </main>
        </>
    )
}
