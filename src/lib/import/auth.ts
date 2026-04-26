import { timingSafeEqual } from "node:crypto"
import { NextRequest } from "next/server"

const DEFAULT_IMPORT_SECRET_HEADER = "x-import-secret"

export function isImportRequestAuthorized(request: NextRequest): boolean {
    const expectedSecret = process.env.IMPORT_API_SECRET?.trim()
    if (!expectedSecret) return false

    const headerName = process.env.IMPORT_API_SECRET_HEADER?.trim() || DEFAULT_IMPORT_SECRET_HEADER
    const providedSecret = request.headers.get(headerName)?.trim()
    if (!providedSecret) return false

    const expected = Buffer.from(expectedSecret)
    const provided = Buffer.from(providedSecret)

    return expected.length === provided.length && timingSafeEqual(expected, provided)
}
