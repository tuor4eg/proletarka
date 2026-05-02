import { NextRequest, NextResponse } from "next/server"
import { createPersonRecord } from "@/lib/people/createPersonRecord"
import { isImportRequestAuthorized } from "@/lib/import/auth"
import { validatePersonImportPayload } from "@/lib/import/personImportValidation"

const MAX_CONTENT_LENGTH = 100_000
const PUBLIC_CREATE_ERROR_MESSAGES = new Set([
    "Недопустимый формат code",
    "Этот code уже занят",
    "Выбраны несуществующие темы",
    "Подтему нельзя выбрать без родительской темы",
])

function buildAbsoluteUrl(path: string): string | null {
    const baseUrl = process.env.APP_URL?.trim()
    if (!baseUrl) return null

    try {
        return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString()
    } catch {
        return null
    }
}

async function readJsonBody(request: NextRequest): Promise<unknown> {
    if (!request.body) {
        throw new Error("EMPTY_BODY")
    }

    const reader = request.body.getReader()
    const chunks: Uint8Array[] = []
    let totalLength = 0

    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value) continue

        totalLength += value.byteLength
        if (totalLength > MAX_CONTENT_LENGTH) {
            throw new Error("PAYLOAD_TOO_LARGE")
        }

        chunks.push(value)
    }

    const body = new TextDecoder().decode(Buffer.concat(chunks))
    return JSON.parse(body)
}

export async function POST(request: NextRequest) {
    if (!isImportRequestAuthorized(request)) {
        return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED" } }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("application/json")) {
        return NextResponse.json(
            { ok: false, error: { code: "UNSUPPORTED_MEDIA_TYPE" } },
            { status: 415 },
        )
    }

    const contentLength = Number(request.headers.get("content-length"))
    if (Number.isFinite(contentLength) && contentLength > MAX_CONTENT_LENGTH) {
        return NextResponse.json(
            { ok: false, error: { code: "PAYLOAD_TOO_LARGE" } },
            { status: 413 },
        )
    }

    let payload: unknown
    try {
        payload = await readJsonBody(request)
    } catch (error) {
        if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
            return NextResponse.json(
                { ok: false, error: { code: "PAYLOAD_TOO_LARGE" } },
                { status: 413 },
            )
        }

        return NextResponse.json(
            { ok: false, error: { code: "INVALID_JSON", message: "Некорректный JSON" } },
            { status: 400 },
        )
    }

    const validation = await validatePersonImportPayload(payload)
    if (!validation.ok) {
        return NextResponse.json(
            {
                ok: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: validation.message,
                    fields: validation.fields,
                },
            },
            { status: 422 },
        )
    }

    try {
        const created = await createPersonRecord(validation.input)
        return NextResponse.json(
            {
                ok: true,
                person: {
                    id: created.personId,
                    entityId: created.entityId,
                    code: created.code,
                    adminUrl: buildAbsoluteUrl(`/admin/people/${created.code}`),
                    publicUrl: buildAbsoluteUrl(`/people/${created.code}`),
                },
                created: {
                    eventsCount: created.eventsCount,
                },
                warnings: validation.warnings,
                possibleDuplicates: validation.possibleDuplicates,
            },
            { status: 201 },
        )
    } catch (error) {
        const message = error instanceof Error ? error.message : "Не удалось создать человека"
        if (PUBLIC_CREATE_ERROR_MESSAGES.has(message)) {
            return NextResponse.json(
                { ok: false, error: { code: "CREATE_REJECTED", message } },
                { status: 422 },
            )
        }

        console.error("Failed to import person", error)
        return NextResponse.json(
            {
                ok: false,
                error: { code: "CREATE_FAILED", message: "Не удалось создать человека" },
            },
            { status: 500 },
        )
    }
}
