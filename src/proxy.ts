import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PATHS = ["/admin/login"]

function getSecret() {
    const secret = process.env.SESSION_SECRET
    if (!secret) throw new Error("SESSION_SECRET is not set")
    return new TextEncoder().encode(secret)
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    const token = request.cookies.get("session")?.value

    if (token) {
        try {
            await jwtVerify(token, getSecret())
            return NextResponse.next()
        } catch {
            // invalid or expired token — fall through to redirect
        }
    }

    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
}

export const config = {
    matcher: ["/admin/:path*"],
}
