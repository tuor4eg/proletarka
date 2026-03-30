export const dynamic = 'force-dynamic'

import Link from "next/link"
import { db } from "@/db"
import { entities, artifacts, materials, showcases } from "@/db/schema"
import { eq, asc, inArray, and, isNotNull } from "drizzle-orm"
import { PageHero } from "@/components/PageHero"
import { PhotoCarousel } from "@/components/PhotoCarousel"

export default async function ExpositionPage() {
    const [artifactRows, showcaseRow] = await Promise.all([
        db
            .select({
                code: artifacts.code,
                title: artifacts.title,
                yearsLabel: artifacts.yearsLabel,
                coverImagePath: artifacts.coverImagePath,
                artifactType: artifacts.artifactType,
            })
            .from(artifacts)
            .innerJoin(entities, eq(entities.artifactId, artifacts.id))
            .where(inArray(artifacts.artifactType, ["stand", "rarity"]))
            .orderBy(asc(artifacts.title)),
        db
            .select({ artifactId: showcases.artifactId })
            .from(showcases)
            .where(eq(showcases.sectionCode, "exposition"))
            .limit(1),
    ])

    const stands = artifactRows.filter((r) => r.artifactType === "stand")
    const rarities = artifactRows.filter((r) => r.artifactType === "rarity")

    let showcasePhotos: { id: number; title: string; coverImagePath: string; yearFrom: number | null; yearTo: number | null; content: string | null }[] = []

    if (showcaseRow[0]) {
        const [entity] = await db
            .select({ id: entities.id })
            .from(entities)
            .where(eq(entities.artifactId, showcaseRow[0].artifactId))
            .limit(1)

        if (entity) {
            showcasePhotos = await db
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
                .orderBy(asc(materials.position), asc(materials.id)) as typeof showcasePhotos
        }
    }

    return (
        <>
            <PageHero title="Выставка" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                {showcasePhotos.length > 0 && (
                    <section className="mb-10">
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
                        <h2 className="text-lg font-semibold text-ink mb-6">Раритеты</h2>
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
                        {item.yearsLabel && (
                            <p className="text-xs text-ink-muted mt-0.5">{item.yearsLabel}</p>
                        )}
                    </div>
                </Link>
            ))}
        </div>
    )
}
