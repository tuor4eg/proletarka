import { NextRequest, NextResponse } from "next/server"
import { searchSources } from "@/db/queries"

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const q = searchParams.get("q")?.trim() ?? ""

    if (!q || q.length < 2) {
        return NextResponse.json([])
    }

    const rows = await searchSources(q, 20)

    return NextResponse.json(rows.map((row) => ({ label: row.label })))
}
