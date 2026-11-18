import { getAdminAccess } from "@/lib/adminAuth"
import { NextRequest, NextResponse } from "next/server"
import { asc, ilike } from "drizzle-orm"
import { db } from "@/db"
import { people } from "@/db/schema"

export async function GET(request: NextRequest) {
    const access = await getAdminAccess()
    if ("status" in access) {
        return NextResponse.json(
            { error: access.status === 401 ? "Unauthorized" : "Forbidden" },
            { status: access.status },
        )
    }

    const { searchParams } = request.nextUrl
    const q = searchParams.get("q")?.trim() ?? ""

    if (!q || q.length < 2) {
        return NextResponse.json([])
    }

    const rows = await db
        .select({
            id: people.id,
            name: people.name,
        })
        .from(people)
        .where(ilike(people.name, `%${q}%`))
        .orderBy(asc(people.name))
        .limit(20)

    return NextResponse.json(rows)
}
