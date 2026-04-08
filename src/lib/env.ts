type RequiredEnvKey =
    | "DATABASE_URL"
    | "SESSION_SECRET"
    | "ALTCHA_HMAC_KEY"
    | "S3_BUCKET"
    | "S3_ACCESS_KEY"
    | "S3_SECRET_KEY"
    | "S3_PUBLIC_URL"

type OptionalEnvKey =
    | "APP_URL"
    | "OUTBOUND_EVENTS_WEBHOOK_URL"
    | "OUTBOUND_EVENTS_SECRET"
    | "S3_ENDPOINT"
    | "S3_REGION"
    | "SECURE_COOKIES"

function readEnv(key: string): string | undefined {
    const value = process.env[key]?.trim()
    return value ? value : undefined
}

function requireEnv(key: RequiredEnvKey): string {
    const value = readEnv(key)

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`)
    }

    return value
}

function optionalEnv(key: OptionalEnvKey): string | undefined {
    return readEnv(key)
}

function optionalUrl(key: OptionalEnvKey): string | undefined {
    const value = optionalEnv(key)
    if (!value) return undefined

    try {
        return new URL(value).toString()
    } catch {
        throw new Error(`Environment variable ${key} must be a valid URL`)
    }
}

function optionalNumber(key: "OUTBOUND_EVENTS_TIMEOUT_MS", fallback: number): number {
    const value = optionalEnv(key)
    if (!value) return fallback

    const parsed = Number(value)
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Environment variable ${key} must be a positive number`)
    }

    return parsed
}

function optionalBoolean(key: "SECURE_COOKIES", fallback = false): boolean {
    const value = optionalEnv(key)
    if (!value) return fallback

    if (value === "true") return true
    if (value === "false") return false

    throw new Error(`Environment variable ${key} must be "true" or "false"`)
}

const outboundEventsWebhookUrl = optionalUrl("OUTBOUND_EVENTS_WEBHOOK_URL")
const outboundEventsSecret = optionalEnv("OUTBOUND_EVENTS_SECRET")

if (outboundEventsWebhookUrl && !outboundEventsSecret) {
    throw new Error(
        "Environment variable OUTBOUND_EVENTS_SECRET is required when OUTBOUND_EVENTS_WEBHOOK_URL is set",
    )
}

export const env = {
    databaseUrl: requireEnv("DATABASE_URL"),
    sessionSecret: requireEnv("SESSION_SECRET"),
    secureCookies: optionalBoolean("SECURE_COOKIES", false),
    altchaHmacKey: requireEnv("ALTCHA_HMAC_KEY"),
    appUrl: optionalUrl("APP_URL"),
    outboundEvents: {
        enabled: Boolean(outboundEventsWebhookUrl),
        webhookUrl: outboundEventsWebhookUrl,
        secret: outboundEventsSecret,
        timeoutMs: optionalNumber("OUTBOUND_EVENTS_TIMEOUT_MS", 3000),
    },
    s3: {
        endpoint: optionalUrl("S3_ENDPOINT"),
        region: optionalEnv("S3_REGION") ?? "us-east-1",
        bucket: requireEnv("S3_BUCKET"),
        accessKeyId: requireEnv("S3_ACCESS_KEY"),
        secretAccessKey: requireEnv("S3_SECRET_KEY"),
        publicUrl: requireEnv("S3_PUBLIC_URL"),
    },
} as const
