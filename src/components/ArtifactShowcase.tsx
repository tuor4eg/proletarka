import { db } from "@/db"
import { entities, artifacts, materials } from "@/db/schema"
import { eq, and, asc, sql } from "drizzle-orm"
import { ArtifactShowcaseView } from "@/components/ArtifactShowcaseView"

type Props = {
    code: string
}

export async function ArtifactShowcase({ code }: Props) {
    const [row] = await db
        .select({ entity: entities, artifact: artifacts })
        .from(entities)
        .innerJoin(artifacts, eq(entities.artifactId, artifacts.id))
        .where(eq(entities.code, code))
        .limit(1)

    if (!row) return null

    const linkedMaterials = await db
        .select({
            id: materials.id,
            title: materials.title,
            summary: materials.summary,
            content: materials.content,
            materialType: materials.materialType,
            coverImagePath: materials.coverImagePath,
            yearFrom: materials.yearFrom,
            yearTo: materials.yearTo,
        })
        .from(materials)
        .where(and(eq(materials.entityId, row.entity.id), eq(materials.status, "published")))
        .orderBy(sql`${materials.position} ASC NULLS LAST`, asc(materials.id))

    return <ArtifactShowcaseView artifact={row.artifact} materials={linkedMaterials} code={code} />
}
