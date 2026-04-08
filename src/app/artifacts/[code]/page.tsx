import { notFound } from "next/navigation"
import { eq, and, asc, sql } from "drizzle-orm"
import Link from "next/link"
import { db } from "@/db"
import {
    entities,
    artifacts,
    materials,
    artifactSections,
    artifactMaterials,
    people,
} from "@/db/schema"
import { PageHero } from "@/components/PageHero"
import { BackButton } from "@/components/BackButton"
import { PhotoCarousel } from "@/components/PhotoCarousel"
import { CommentsSection } from "@/components/comments/CommentsSection"

type Props = {
    params: Promise<{ code: string }>
    searchParams: Promise<{ page?: string; sort?: "date_desc" | "date_asc" }>
}

export default async function ArtifactPage({ params, searchParams }: Props) {
    const { code } = await params
    const { page: pageParam, sort = "date_desc" } = await searchParams
    const commentsPage = Math.max(1, Number(pageParam) || 1)

    const [row] = await db
        .select({ entity: entities, artifact: artifacts })
        .from(entities)
        .innerJoin(artifacts, eq(entities.artifactId, artifacts.id))
        .where(eq(entities.code, code))
        .limit(1)

    if (!row) notFound()

    const { artifact, entity } = row

    const [nativeMaterials, sections, refMaterialRows] = await Promise.all([
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
                position: materials.position,
            })
            .from(materials)
            .where(and(eq(materials.entityId, entity.id), eq(materials.status, "published")))
            .orderBy(sql`${materials.position} ASC NULLS LAST`, asc(materials.id)),
        db
            .select()
            .from(artifactSections)
            .where(eq(artifactSections.artifactId, artifact.id))
            .orderBy(asc(artifactSections.position)),
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
                sectionId: artifactMaterials.sectionId,
                position: artifactMaterials.position,
                personName: people.name,
                personCode: people.code,
            })
            .from(artifactMaterials)
            .innerJoin(materials, eq(artifactMaterials.materialId, materials.id))
            .leftJoin(entities, eq(materials.entityId, entities.id))
            .leftJoin(people, eq(entities.personId, people.id))
            .where(
                and(
                    eq(artifactMaterials.artifactId, artifact.id),
                    eq(materials.status, "published"),
                ),
            )
            .orderBy(sql`${artifactMaterials.position} ASC NULLS LAST`, asc(materials.id)),
    ])

    // merge: native + ref — dedup by id, sort by position
    const seenIds = new Set(nativeMaterials.map((m) => m.id))
    const nativeWithAttrs = nativeMaterials.map((m) => ({
        ...m,
        personName: null,
        personCode: null,
    }))
    const refFiltered = refMaterialRows.filter((m) => !seenIds.has(m.id))
    const allMaterials = [...nativeWithAttrs, ...refFiltered].sort(
        (a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER),
    )

    const isStand = artifact.artifactType === "stand"

    function renderMaterials(items: typeof allMaterials) {
        const photos = items.filter(
            (m) => m.materialType === "photo" && m.coverImagePath,
        ) as ((typeof items)[number] & { coverImagePath: string })[]
        const others = items.filter((m) => m.materialType !== "photo")

        return (
            <>
                {photos.length > 0 && (
                    <div className="mb-6">
                        <PhotoCarousel photos={photos} />
                    </div>
                )}
                {others.length > 0 && (
                    <div className="flex flex-col divide-y divide-paper-border">
                        {others.map((m) => (
                            <Link
                                key={m.id}
                                href={`/materials/${m.id}`}
                                className="relative py-5 hover:opacity-75 transition-opacity"
                            >
                                <div className="flex items-start gap-4">
                                    {m.coverImagePath && (
                                        <img
                                            src={m.coverImagePath}
                                            alt={m.title}
                                            className="w-20 h-20 object-cover rounded-xl shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold mb-1 leading-snug">
                                            {m.title}
                                        </h3>
                                        {m.summary && (
                                            <p className="text-sm text-ink-muted mb-2 line-clamp-2">
                                                {m.summary}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-ink-muted mb-2">
                                            {m.personName && <span>{m.personName}</span>}
                                            {(m.yearFrom || m.yearTo) && (
                                                <span>
                                                    {m.yearFrom === m.yearTo || !m.yearTo
                                                        ? m.yearFrom
                                                        : `${m.yearFrom}–${m.yearTo}`}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-sepia">Подробнее →</span>
                                    </div>
                                </div>
                            </Link>
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
                    <h1 className="text-2xl font-bold tracking-wide text-ink leading-snug">
                        {artifact.title}
                    </h1>
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
                        {sections.filter((s) => allMaterials.some((m) => m.sectionId === s.id))
                            .length > 1 && (
                            <nav className="flex flex-wrap items-center gap-y-1">
                                {sections
                                    .filter((s) => allMaterials.some((m) => m.sectionId === s.id))
                                    .map((section, i, arr) => (
                                        <span key={section.id} className="flex items-center">
                                            <a
                                                href={`#section-${section.id}`}
                                                className="text-sm text-ink-muted hover:text-ink transition-colors"
                                            >
                                                {section.title}
                                            </a>
                                            {i < arr.length - 1 && (
                                                <span className="mx-2 text-ink-muted select-none">
                                                    ·
                                                </span>
                                            )}
                                        </span>
                                    ))}
                            </nav>
                        )}
                        {sections.map((section) => {
                            const sectionMaterials = allMaterials.filter(
                                (m) => m.sectionId === section.id,
                            )
                            if (sectionMaterials.length === 0) return null
                            return (
                                <div key={section.id} id={`section-${section.id}`}>
                                    <h2 className="text-base font-semibold mb-2 pb-2 border-b border-paper-border">
                                        {section.title}
                                    </h2>
                                    {section.description && (
                                        <p className="text-sm text-ink-secondary leading-relaxed mb-4">
                                            {section.description}
                                        </p>
                                    )}
                                    {renderMaterials(sectionMaterials)}
                                </div>
                            )
                        })}
                        {(() => {
                            const unsectioned = allMaterials.filter((m) => !m.sectionId)
                            return unsectioned.length > 0 && renderMaterials(unsectioned)
                        })()}
                    </div>
                ) : (
                    renderMaterials(allMaterials)
                )}

                <CommentsSection entityId={entity.id} page={commentsPage} sort={sort} />
            </main>
        </>
    )
}
