import { and, asc, eq, inArray, isNotNull, sql } from "drizzle-orm"
import { db } from "@/db"
import { materials } from "@/db/schema"

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
            )
        )
        .orderBy(materials.entityId, sql`${materials.position} ASC NULLS LAST`, asc(materials.id))

    return new Map(rows.filter((r) => r.entityId !== null).map((r) => [r.entityId!, r.coverImagePath!]))
}
