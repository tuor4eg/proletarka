import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { env } from "@/lib/env"

const COOKIE_NAME = "session"
const EXPIRES_IN = 60 * 60 * 24 * 7 // 7 days in seconds

function getSecret() {
    return new TextEncoder().encode(env.sessionSecret)
}

export type SessionPayload = {
    userId: number
    role: string
}

export async function createSession(payload: SessionPayload) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(`${EXPIRES_IN}s`)
        .sign(getSecret())

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.secureCookies,
        maxAge: EXPIRES_IN,
        path: "/",
    })
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    try {
        const { payload } = await jwtVerify(token, getSecret())
        return payload as unknown as SessionPayload
    } catch {
        return null
    }
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}
