import { NextRequest, NextResponse } from "next/server"
import { isImportRequestAuthorized } from "@/lib/import/auth"
import { fetchImportTopicTree, type ImportTopicFilter } from "@/db/queries"

function parseSystemFilter(value: string | null): ImportTopicFilter | null {
    if (value === null || value === "" || value === "true") return "system"
    if (value === "all") return "all"
    if (value === "false") return "nonSystem"
    return null
}

export async function GET(request: NextRequest) {
    if (!isImportRequestAuthorized(request)) {
        return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }

    const filter = parseSystemFilter(request.nextUrl.searchParams.get("system"))
    if (!filter) {
        return NextResponse.json(
            {
                ok: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Параметр system должен быть true, false или all",
                },
            },
            { status: 422 },
        )
    }

    return NextResponse.json({
        ok: true,
        topics: await fetchImportTopicTree(filter),
    })
}
