export const dynamic = 'force-dynamic'

import Link from "next/link"
import { db } from "@/db"
import { entities, artifacts } from "@/db/schema"
import { eq, asc, inArray } from "drizzle-orm"
import { PageHero } from "@/components/PageHero"

export default async function ExpositionPage() {
    const rows = await db
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
        .orderBy(asc(artifacts.title))

    const stands = rows.filter((r) => r.artifactType === "stand")
    const rarities = rows.filter((r) => r.artifactType === "rarity")

    return (
        <>
            <PageHero title="Выставка" />
            <main className="max-w-2xl mx-auto px-4 py-8">
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
