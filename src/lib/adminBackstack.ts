const MAX_BACKSTACK_DEPTH = 10

function normalizeAdminPath(value: unknown): string | null {
    if (typeof value !== "string") return null

    const trimmed = value.trim()
    if (!trimmed.startsWith("/admin")) return null
    if (trimmed.startsWith("//")) return null

    return trimmed
}

function sanitizeBackstack(values: unknown[]): string[] {
    const result: string[] = []

    for (const value of values) {
        const path = normalizeAdminPath(value)
        if (!path) continue
        if (result[result.length - 1] === path) continue
        result.push(path)
    }

    return result.slice(-MAX_BACKSTACK_DEPTH)
}

export function parseBackstack(value?: string): string[] {
    if (!value) return []

    try {
        const parsed = JSON.parse(value)
        if (!Array.isArray(parsed)) return []
        return sanitizeBackstack(parsed)
    } catch {
        return []
    }
}

export function serializeBackstack(stack: string[]): string {
    return JSON.stringify(sanitizeBackstack(stack))
}

export function pushBackstack(stack: string[], currentUrl: string): string[] {
    const next = sanitizeBackstack(stack)
    const normalizedCurrentUrl = normalizeAdminPath(currentUrl)

    if (!normalizedCurrentUrl) return next
    if (next[next.length - 1] === normalizedCurrentUrl) return next

    return [...next, normalizedCurrentUrl].slice(-MAX_BACKSTACK_DEPTH)
}

export function getBackHref(stack: string[], fallback: string): string {
    const sanitizedStack = sanitizeBackstack(stack)
    const normalizedFallback = normalizeAdminPath(fallback)
    return sanitizedStack.length > 0
        ? sanitizedStack[sanitizedStack.length - 1]
        : (normalizedFallback ?? "/admin")
}

export function buildBackstackHref(path: string, stack: string[]): string {
    if (stack.length === 0) return path
    const params = new URLSearchParams()
    params.set("backstack", serializeBackstack(stack))
    return `${path}${path.includes("?") ? "&" : "?"}${params.toString()}`
}

export function appendBackstackParam(path: string, backstack?: string): string {
    if (!backstack) return path
    const params = new URLSearchParams()
    params.set("backstack", backstack)
    return `${path}${path.includes("?") ? "&" : "?"}${params.toString()}`
}
