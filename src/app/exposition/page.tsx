export const dynamic = "force-dynamic"

import Link from "next/link"
import { db } from "@/db"
import { entities, artifacts, materials, showcases } from "@/db/schema"
import { eq, asc, inArray, and, isNotNull, sql } from "drizzle-orm"
import { fetchFirstPhotoMap, fetchMaterialSourcesMap, type SourceLink } from "@/db/queries"
import { PageHero } from "@/components/PageHero"
import { PhotoCarousel } from "@/components/PhotoCarousel"

export default async function ExpositionPage() {
    const [artifactRows, showcaseRow] = await Promise.all([
        db
            .select({
                entityId: entities.id,
                code: artifacts.code,
                title: artifacts.title,
                yearsLabel: artifacts.yearsLabel,
                yearFrom: artifacts.yearFrom,
                yearTo: artifacts.yearTo,
                coverImagePath: artifacts.coverImagePath,
                artifactType: artifacts.artifactType,
            })
            .from(artifacts)
            .innerJoin(entities, eq(entities.artifactId, artifacts.id))
            .where(inArray(artifacts.artifactType, ["stand", "rarity"]))
            .orderBy(sql`${artifacts.yearFrom} ASC NULLS LAST`, asc(artifacts.title)),
        db
            .select({
                artifactId: showcases.artifactId,
                title: artifacts.title,
                description: artifacts.description,
            })
            .from(showcases)
            .innerJoin(artifacts, eq(artifacts.id, showcases.artifactId))
            .where(eq(showcases.sectionCode, "exposition"))
            .limit(1),
    ])

    const noCoverIds = artifactRows.filter((r) => !r.coverImagePath).map((r) => r.entityId)
    const fallbackMap = await fetchFirstPhotoMap(noCoverIds)

    const stands = artifactRows
        .filter((r) => r.artifactType === "stand")
        .map((r) => ({
            ...r,
            coverImagePath: r.coverImagePath ?? fallbackMap.get(r.entityId) ?? null,
        }))
    const rarities = artifactRows
        .filter((r) => r.artifactType === "rarity")
        .map((r) => ({
            ...r,
            coverImagePath: r.coverImagePath ?? fallbackMap.get(r.entityId) ?? null,
        }))

    const showcaseMeta = showcaseRow[0]
        ? { title: showcaseRow[0].title, description: showcaseRow[0].description }
        : null
    let showcasePhotos: {
        id: number
        title: string
        coverImagePath: string
        yearFrom: number | null
        yearTo: number | null
        content: string | null
        sources: SourceLink[]
    }[] = []

    if (showcaseRow[0]) {
        const [entity] = await db
            .select({ id: entities.id })
            .from(entities)
            .where(eq(entities.artifactId, showcaseRow[0].artifactId))
            .limit(1)

        if (entity) {
            showcasePhotos = (await db
                .select({
                    id: materials.id,
                    title: materials.title,
                    coverImagePath: materials.coverImagePath,
                    yearFrom: materials.yearFrom,
                    yearTo: materials.yearTo,
                    content: materials.content,
                })
                .from(materials)
                .where(
                    and(
                        eq(materials.entityId, entity.id),
                        eq(materials.materialType, "photo"),
                        eq(materials.status, "published"),
                        isNotNull(materials.coverImagePath),
                    ),
                )
                .orderBy(asc(materials.position), asc(materials.id))) as Array<
                Omit<(typeof showcasePhotos)[number], "sources">
            >

            const sourcesMap = await fetchMaterialSourcesMap(rows.map((row) => row.id))
            showcasePhotos = rows.map((row) => ({
                ...row,
                sources: sourcesMap.get(row.id) ?? [],
            }))
        }
    }

    return (
        <>
            <PageHero title="Выставка" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                {showcasePhotos.length > 0 && (
                    <section className="mb-10">
                        {showcaseMeta && (
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-ink">
                                    {showcaseMeta.title}
                                </h2>
                                {showcaseMeta.description && (
                                    <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
                                        {showcaseMeta.description}
                                    </p>
                                )}
                            </div>
                        )}
                        <PhotoCarousel photos={showcasePhotos} />
                    </section>
                )}

                {stands.length > 0 && (
                    <section className="pt-4 mb-10">
                        <h2 className="text-lg font-semibold text-ink mb-6">Стенды</h2>
                        <ArtifactGrid items={stands} />
                    </section>
                )}
                {rarities.length > 0 && (
                    <section className="pt-4">
                        <h2 className="text-lg font-semibold text-ink mb-6">Экспонаты</h2>
                        <ArtifactGrid items={rarities} />
                    </section>
                )}
                {stands.length === 0 && rarities.length === 0 && (
                    <p className="text-sm text-ink-muted pt-4">Экспонаты не найдены.</p>
                )}
            </main>
        </>
    )
}

type ArtifactItem = {
    code: string
    title: string
    yearsLabel: string | null
    yearFrom: number | null
    yearTo: number | null
    coverImagePath: string | null
}

function ArtifactGrid({ items }: { items: ArtifactItem[] }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {items.map((item) => (
                <Link
                    key={item.code}
                    href={`/artifacts/${item.code}`}
                    className="group flex flex-col gap-2"
                >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-paper-dark">
                        {item.coverImagePath ? (
                            <img
                                src={item.coverImagePath}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="w-full h-full" />
                        )}
                    </div>
                    <div className="px-1">
                        <p className="text-sm font-medium leading-snug">{item.title}</p>
                        {(item.yearFrom || item.yearsLabel) && (
                            <p className="text-xs text-ink-muted mt-0.5">
                                {item.yearFrom
                                    ? item.yearTo
                                        ? `${item.yearFrom}–${item.yearTo}`
                                        : String(item.yearFrom)
                                    : item.yearsLabel}
                            </p>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    )
}
