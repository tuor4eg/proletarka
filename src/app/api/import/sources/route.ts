import { NextRequest, NextResponse } from "next/server"
import { isImportRequestAuthorized } from "@/lib/import/auth"
import { searchSources } from "@/db/queries"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

export async function GET(request: NextRequest) {
    if (!isImportRequestAuthorized(request)) {
        return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? ""
    const rawLimit = Number(request.nextUrl.searchParams.get("limit"))
    const limit = Math.min(
        MAX_LIMIT,
        Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT,
    )
    const rows = await searchSources(q, limit)

    return NextResponse.json({
        ok: true,
        sources: rows,
    })
}
