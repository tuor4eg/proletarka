import { createChallenge, verifySolution } from "altcha-lib"
import { env } from "@/lib/env"

const ALTCHA_EXPIRES_IN_MS = 5 * 60 * 1000
const ALTCHA_MAX_NUMBER = 10_000

export async function createAltchaCommentChallenge() {
    return createChallenge({
        hmacKey: env.altchaHmacKey,
        expires: new Date(Date.now() + ALTCHA_EXPIRES_IN_MS),
        maxNumber: ALTCHA_MAX_NUMBER,
    })
}

export async function verifyAltchaCommentPayload(payload: string | null) {
    if (!payload) return false
    return verifySolution(payload, env.altchaHmacKey)
}
