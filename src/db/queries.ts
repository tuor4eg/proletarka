import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm"
import { db } from "@/db"
import { materials, materialSources, sources } from "@/db/schema"

export type SourceLink = {
    id: number
    label: string
    url: string
}

export async function fetchFirstPhotoMap(entityIds: number[]): Promise<Map<number, string>> {
    if (entityIds.length === 0) return new Map()

    const rows = await db
        .selectDistinctOn([materials.entityId], {
            entityId: materials.entityId,
            coverImagePath: materials.coverImagePath,
        })
        .from(materials)
        .where(
            and(
                inArray(materials.entityId, entityIds),
                eq(materials.materialType, "photo"),
                isNotNull(materials.coverImagePath),
                eq(materials.status, "published"),
            ),
        )
        .orderBy(materials.entityId, sql`${materials.position} ASC NULLS LAST`, asc(materials.id))

    return new Map(
        rows.filter((r) => r.entityId !== null).map((r) => [r.entityId!, r.coverImagePath!]),
    )
}

export async function fetchMaterialSourcesMap(
    materialIds: number[],
): Promise<Map<number, SourceLink[]>> {
    if (materialIds.length === 0) return new Map()

    const rows = await db
        .select({
            materialId: materialSources.materialId,
            sourceId: sources.id,
            label: sources.label,
            url: sources.url,
        })
        .from(materialSources)
        .innerJoin(sources, eq(materialSources.sourceId, sources.id))
        .where(inArray(materialSources.materialId, materialIds))
        .orderBy(asc(sources.label), asc(sources.id))

    const map = new Map<number, SourceLink[]>()

    for (const row of rows) {
        if (!map.has(row.materialId)) {
            map.set(row.materialId, [])
        }

        map.get(row.materialId)!.push({
            id: row.sourceId,
            label: row.label,
            url: row.url,
        })
    }

    return map
}
