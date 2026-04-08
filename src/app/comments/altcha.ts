import { createChallenge, verifySolution } from "altcha-lib"

const ALTCHA_EXPIRES_IN_MS = 5 * 60 * 1000
const ALTCHA_MAX_NUMBER = 10_000

function getAltchaHmacKey() {
    const key = process.env.ALTCHA_HMAC_KEY
    if (!key) {
        throw new Error("ALTCHA_HMAC_KEY is not set")
    }

    return key
}

export async function createAltchaCommentChallenge() {
    return createChallenge({
        hmacKey: getAltchaHmacKey(),
        expires: new Date(Date.now() + ALTCHA_EXPIRES_IN_MS),
        maxNumber: ALTCHA_MAX_NUMBER,
    })
}

export async function verifyAltchaCommentPayload(payload: string | null) {
    if (!payload) return false
    return verifySolution(payload, getAltchaHmacKey())
}
