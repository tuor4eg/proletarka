import { NextRequest, NextResponse } from "next/server"
import { asc, ilike } from "drizzle-orm"
import { db } from "@/db"
import { sources } from "@/db/schema"

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const q = searchParams.get("q")?.trim() ?? ""

    if (!q || q.length < 2) {
        return NextResponse.json([])
    }

    const rows = await db
        .selectDistinct({
            label: sources.label,
        })
        .from(sources)
        .where(ilike(sources.label, `%${q}%`))
        .orderBy(asc(sources.label))
        .limit(20)

    return NextResponse.json(rows)
}
