import { getAdminAccess } from "@/lib/adminAuth"
import { NextRequest, NextResponse } from "next/server"
import { searchSources } from "@/db/queries"

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

    const rows = await searchSources(q, 20)

    return NextResponse.json(rows.map((row) => ({ label: row.label })))
}
