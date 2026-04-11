import { NextRequest, NextResponse } from "next/server"
import { ilike, eq, notInArray, and, asc, or, inArray } from "drizzle-orm"
import { db } from "@/db"
import {
    materials,
    entities,
    people,
    artifacts,
    artifactMaterials,
    personMaterials,
    type MaterialType,
} from "@/db/schema"

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const q = searchParams.get("q")?.trim() ?? ""
    const excludeArtifactId = Number(searchParams.get("excludeArtifactId"))
    const typeFilter = searchParams.get("type") ?? ""

    if (!q || q.length < 2) {
        return NextResponse.json([])
    }

    const alreadyLinked = excludeArtifactId
        ? await db
              .select({ materialId: artifactMaterials.materialId })
              .from(artifactMaterials)
              .where(eq(artifactMaterials.artifactId, excludeArtifactId))
        : []

    const excludeIds = alreadyLinked.map((r) => r.materialId)

    const baseConditions = [
        or(
            ilike(materials.title, `%${q}%`),
            ilike(people.name, `%${q}%`),
            ilike(artifacts.title, `%${q}%`),
        ),
        typeFilter ? eq(materials.materialType, typeFilter as MaterialType) : undefined,
        excludeIds.length > 0 ? notInArray(materials.id, excludeIds) : undefined,
    ].filter(Boolean) as Parameters<typeof and>

    const baseRows = await db
        .select({
            id: materials.id,
            title: materials.title,
            materialType: materials.materialType,
            personName: people.name,
            artifactTitle: artifacts.title,
        })
        .from(materials)
        .leftJoin(entities, eq(materials.entityId, entities.id))
        .leftJoin(people, eq(entities.personId, people.id))
        .leftJoin(artifacts, eq(entities.artifactId, artifacts.id))
        .where(and(...baseConditions))
        .orderBy(asc(materials.title))
        .limit(50)

    const groupPhotoRows = await db
        .select({
            id: materials.id,
            title: materials.title,
            materialType: materials.materialType,
            linkedPersonName: people.name,
        })
        .from(materials)
        .innerJoin(personMaterials, eq(personMaterials.materialId, materials.id))
        .innerJoin(people, eq(personMaterials.personId, people.id))
        .where(
            and(
                eq(materials.materialType, "group_photo"),
                or(ilike(materials.title, `%${q}%`), ilike(people.name, `%${q}%`)),
                typeFilter ? eq(materials.materialType, typeFilter as MaterialType) : undefined,
                excludeIds.length > 0 ? notInArray(materials.id, excludeIds) : undefined,
            ),
        )
        .orderBy(asc(materials.title))
        .limit(100)

    const groupPhotoIds = Array.from(new Set(groupPhotoRows.map((row) => row.id)))
    const allGroupPhotoPeople = groupPhotoIds.length
        ? await db
              .select({
                  materialId: personMaterials.materialId,
                  personName: people.name,
              })
              .from(personMaterials)
              .innerJoin(people, eq(personMaterials.personId, people.id))
              .where(inArray(personMaterials.materialId, groupPhotoIds))
        : []

    const personNamesByGroupPhotoId = new Map<number, string[]>()
    for (const row of allGroupPhotoPeople) {
        if (!personNamesByGroupPhotoId.has(row.materialId)) {
            personNamesByGroupPhotoId.set(row.materialId, [])
        }
        const names = personNamesByGroupPhotoId.get(row.materialId)!
        if (!names.includes(row.personName)) {
            names.push(row.personName)
        }
    }

    const groupedBaseRows = new Map<
        number,
        {
            id: number
            title: string
            materialType: MaterialType
            personName: string | null
            artifactTitle: string | null
            personNames: string[]
        }
    >()

    for (const row of baseRows) {
        if (!groupedBaseRows.has(row.id)) {
            groupedBaseRows.set(row.id, {
                id: row.id,
                title: row.title,
                materialType: row.materialType,
                personName: row.personName,
                artifactTitle: row.artifactTitle,
                personNames:
                    row.materialType === "group_photo"
                        ? (personNamesByGroupPhotoId.get(row.id) ?? [])
                        : row.personName
                          ? [row.personName]
                          : [],
            })
        }
    }

    for (const row of groupPhotoRows) {
        if (!groupedBaseRows.has(row.id)) {
            groupedBaseRows.set(row.id, {
                id: row.id,
                title: row.title,
                materialType: row.materialType,
                personName: null,
                artifactTitle: null,
                personNames: personNamesByGroupPhotoId.get(row.id) ?? [],
            })
        }
    }

    return NextResponse.json(Array.from(groupedBaseRows.values()).slice(0, 20))
}
