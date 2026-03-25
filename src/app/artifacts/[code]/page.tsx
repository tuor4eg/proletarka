import { notFound } from "next/navigation"
import { eq, and, asc, sql } from "drizzle-orm"
import { db } from "@/db"
import { entities, artifacts, materials } from "@/db/schema"
import { PublicNavWrapper } from "@/components/PublicNavWrapper"
import { BackButton } from "@/components/BackButton"
import { MaterialCard } from "@/components/MaterialCard"

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

    const linkedMaterials = await db
        .select({
            id: materials.id,
            title: materials.title,
            summary: materials.summary,
            yearFrom: materials.yearFrom,
            yearTo: materials.yearTo,
        })
        .from(materials)
        .where(and(eq(materials.entityId, entity.id), eq(materials.status, "published")))
        .orderBy(sql`${materials.position} ASC NULLS LAST`, asc(materials.id))

    return (
        <>
            <PublicNavWrapper />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <BackButton />
                </div>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">{artifact.title}</h1>
                    {artifact.yearsLabel && (
                        <p className="text-sm text-gray-400 mt-1">{artifact.yearsLabel}</p>
                    )}
                    {artifact.description && (
                        <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                            {artifact.description}
                        </p>
                    )}
                </div>

                {linkedMaterials.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {linkedMaterials.map((m) => (
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
            </main>
        </>
    )
}
