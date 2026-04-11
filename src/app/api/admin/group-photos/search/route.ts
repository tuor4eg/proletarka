import { NextRequest, NextResponse } from "next/server"
import { and, asc, eq, ilike, inArray, notInArray, or } from "drizzle-orm"
import { db } from "@/db"
import { materials, people, personMaterials } from "@/db/schema"

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const q = searchParams.get("q")?.trim() ?? ""
    const excludePersonId = Number(searchParams.get("excludePersonId"))

    if (!q || q.length < 2) {
        return NextResponse.json([])
    }

    const alreadyLinked =
        Number.isInteger(excludePersonId) && excludePersonId > 0
            ? await db
                  .select({ materialId: personMaterials.materialId })
                  .from(personMaterials)
                  .where(eq(personMaterials.personId, excludePersonId))
            : []

    const excludeIds = alreadyLinked.map((row) => row.materialId)

    const rows = await db
        .select({
            id: materials.id,
            title: materials.title,
            status: materials.status,
        })
        .from(materials)
        .leftJoin(personMaterials, eq(personMaterials.materialId, materials.id))
        .leftJoin(people, eq(personMaterials.personId, people.id))
        .where(
            and(
                eq(materials.materialType, "group_photo"),
                or(ilike(materials.title, `%${q}%`), ilike(people.name, `%${q}%`)),
                excludeIds.length > 0 ? notInArray(materials.id, excludeIds) : undefined,
            ),
        )
        .orderBy(asc(materials.title))
        .limit(100)

    const materialIds = Array.from(new Set(rows.map((row) => row.id)))
    const linkedPeopleRows = materialIds.length
        ? await db
              .select({
                  materialId: personMaterials.materialId,
                  linkedPersonName: people.name,
              })
              .from(personMaterials)
              .innerJoin(people, eq(personMaterials.personId, people.id))
              .where(inArray(personMaterials.materialId, materialIds))
              .orderBy(asc(people.name))
        : []

    const linkedPeopleByMaterialId = new Map<number, string[]>()
    for (const row of linkedPeopleRows) {
        const current = linkedPeopleByMaterialId.get(row.materialId) ?? []
        if (!current.includes(row.linkedPersonName)) {
            current.push(row.linkedPersonName)
        }
        linkedPeopleByMaterialId.set(row.materialId, current)
    }

    const grouped = new Map<
        number,
        {
            id: number
            title: string
            status: "draft" | "published"
            linkedPeople: string[]
        }
    >()

    for (const row of rows) {
        if (!grouped.has(row.id)) {
            grouped.set(row.id, {
                id: row.id,
                title: row.title,
                status: row.status,
                linkedPeople: linkedPeopleByMaterialId.get(row.id) ?? [],
            })
        }
    }

    return NextResponse.json(Array.from(grouped.values()).slice(0, 20))
}
