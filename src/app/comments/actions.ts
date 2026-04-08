"use server"

import { createHash } from "node:crypto"
import { headers } from "next/headers"
import { and, count, eq, gte } from "drizzle-orm"
import { db } from "@/db"
import { comments } from "@/db/schema"
import { verifyAltchaCommentPayload } from "@/app/comments/altcha"
import { getCommentTargetByEntityId } from "@/app/comments/queries"

export type CreateCommentResult = {
    type: "success" | "error"
    message: string
} | null

const MAX_AUTHOR_LENGTH = 80
const MIN_BODY_LENGTH = 3
const MAX_BODY_LENGTH = 2000
const COMMENT_MIN_INTERVAL_MS = 60 * 1000
const COMMENT_HOURLY_LIMIT = 5
const COMMENT_HOURLY_WINDOW_MS = 60 * 60 * 1000

function normalizeOptionalText(value: FormDataEntryValue | null): string | null {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

function hashIp(ip: string | null): string | null {
    if (!ip) return null
    return createHash("sha256").update(ip).digest("hex")
}

async function getRequestIp(): Promise<string | null> {
    const headersList = await headers()
    const forwardedFor = headersList.get("x-forwarded-for")
    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() ?? null
    }

    return headersList.get("x-real-ip")
}

async function hasRecentComment(ipHash: string): Promise<boolean> {
    const since = new Date(Date.now() - COMMENT_MIN_INTERVAL_MS)

    const [row] = await db
        .select({ total: count() })
        .from(comments)
        .where(and(eq(comments.ipHash, ipHash), gte(comments.createdAt, since)))

    return (row?.total ?? 0) > 0
}

async function hasReachedHourlyCommentLimit(ipHash: string): Promise<boolean> {
    const since = new Date(Date.now() - COMMENT_HOURLY_WINDOW_MS)

    const [row] = await db
        .select({ total: count() })
        .from(comments)
        .where(and(eq(comments.ipHash, ipHash), gte(comments.createdAt, since)))

    return (row?.total ?? 0) >= COMMENT_HOURLY_LIMIT
}

export async function createComment(
    _prev: CreateCommentResult,
    formData: FormData,
): Promise<CreateCommentResult> {
    const entityIdRaw = formData.get("entityId")
    const altchaPayload = normalizeOptionalText(formData.get("altcha"))
    const honeypot = normalizeOptionalText(formData.get("website"))
    const author = normalizeOptionalText(formData.get("author"))
    const body = normalizeOptionalText(formData.get("body"))
    const ip = await getRequestIp()
    const ipHash = hashIp(ip)

    const entityId = typeof entityIdRaw === "string" ? Number(entityIdRaw) : NaN
    if (!Number.isInteger(entityId) || entityId <= 0) {
        return { type: "error", message: "Не удалось определить страницу для комментария." }
    }

    const target = await getCommentTargetByEntityId(entityId)
    if (!target) {
        return { type: "error", message: "Страница для комментария не найдена." }
    }

    if (author && author.length > MAX_AUTHOR_LENGTH) {
        return { type: "error", message: "Подпись слишком длинная." }
    }

    if (!body || body.length < MIN_BODY_LENGTH) {
        return { type: "error", message: "Комментарий слишком короткий." }
    }

    if (body.length > MAX_BODY_LENGTH) {
        return { type: "error", message: "Комментарий слишком длинный." }
    }

    if (honeypot) {
        return { type: "error", message: "Не удалось отправить комментарий." }
    }

    const altchaVerified = await verifyAltchaCommentPayload(altchaPayload)
    if (!altchaVerified) {
        return { type: "error", message: "Проверка на спам не пройдена. Попробуйте ещё раз." }
    }

    if (ipHash) {
        if (await hasRecentComment(ipHash)) {
            return {
                type: "error",
                message: "Слишком частая отправка. Попробуйте ещё раз чуть позже.",
            }
        }

        if (await hasReachedHourlyCommentLimit(ipHash)) {
            return {
                type: "error",
                message: "Слишком много комментариев за короткое время. Попробуйте позже.",
            }
        }
    }

    await db.insert(comments).values({
        entityId,
        author,
        body,
        ipHash,
    })

    return {
        type: "success",
        message: "Комментарий отправлен и появится после модерации.",
    }
}
