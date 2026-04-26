import { NextRequest, NextResponse } from "next/server"
import { isImportRequestAuthorized } from "@/lib/import/auth"
import { fetchImportTopics } from "@/db/queries"

export async function GET(request: NextRequest) {
    if (!isImportRequestAuthorized(request)) {
        return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }

    return NextResponse.json({
        ok: true,
        topics: await fetchImportTopics(),
    })
}
