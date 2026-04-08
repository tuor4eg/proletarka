import type { CommentTarget } from "@/app/comments/queries"
import { env } from "@/lib/env"

type OutboundEventSeverity = "low" | "normal" | "high"

export type OutboundEvent = {
    event: string
    occurredAt: string
    severity: OutboundEventSeverity
    resource: {
        kind: string
        id: string
    }
    payload: Record<string, unknown>
}

type CommentCreatedEventInput = {
    comment: {
        id: number
        author: string | null
        body: string
        createdAt: Date
        status: "pending"
    }
    target: CommentTarget
}

const DEFAULT_BODY_PREVIEW_LENGTH = 400

function trimTrailingSlash(value: string): string {
    return value.endsWith("/") ? value.slice(0, -1) : value
}

function buildAbsoluteUrl(path: string): string | null {
    const baseUrl = env.appUrl
    if (!baseUrl) return null

    try {
        return new URL(path, `${trimTrailingSlash(baseUrl)}/`).toString()
    } catch {
        return null
    }
}

function buildBodyPreview(body: string, maxLength = DEFAULT_BODY_PREVIEW_LENGTH): string {
    const normalized = body.replace(/\s+/g, " ").trim()
    if (normalized.length <= maxLength) {
        return normalized
    }

    return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

export function buildCommentCreatedEvent({
    comment,
    target,
}: CommentCreatedEventInput): OutboundEvent {
    return {
        event: "comment.created",
        occurredAt: comment.createdAt.toISOString(),
        severity: "normal",
        resource: {
            kind: "comment",
            id: String(comment.id),
        },
        payload: {
            comment: {
                id: comment.id,
                author: comment.author,
                bodyPreview: buildBodyPreview(comment.body),
                createdAt: comment.createdAt.toISOString(),
                status: comment.status,
            },
            target: {
                entityId: target.entityId,
                type: target.type,
                title: target.title,
                publicPath: target.publicPath,
            },
            links: {
                publicUrl: buildAbsoluteUrl(target.publicPath),
                adminUrl: buildAbsoluteUrl("/admin/comments"),
            },
        },
    }
}

export async function sendOutboundEvent(event: OutboundEvent): Promise<void> {
    const webhookUrl = env.outboundEvents.webhookUrl
    if (!webhookUrl) return

    const secret = env.outboundEvents.secret
    const timeoutMs = env.outboundEvents.timeoutMs

    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            ...(secret ? { "x-outbound-events-secret": secret } : {}),
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(timeoutMs),
    })

    if (!response.ok) {
        throw new Error(`Outbound event request failed with status ${response.status}`)
    }
}
