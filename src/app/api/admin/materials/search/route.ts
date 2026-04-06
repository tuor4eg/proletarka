import { NextRequest, NextResponse } from "next/server"
import { ilike, eq, notInArray, and, asc, or } from "drizzle-orm"
import { db } from "@/db"
import { materials, entities, people, artifacts, artifactMaterials } from "@/db/schema"

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

    const conditions = [
        or(
            ilike(materials.title, `%${q}%`),
            ilike(people.name, `%${q}%`),
            ilike(artifacts.title, `%${q}%`),
        ),
        typeFilter
            ? eq(materials.materialType, typeFilter as "article" | "photo" | "document")
            : undefined,
        excludeIds.length > 0 ? notInArray(materials.id, excludeIds) : undefined,
    ].filter(Boolean) as Parameters<typeof and>

    const rows = await db
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
        .where(and(...conditions))
        .orderBy(asc(materials.title))
        .limit(20)

    return NextResponse.json(rows)
}
