import { NextResponse } from "next/server"
import { createAltchaCommentChallenge } from "@/app/comments/altcha"

export async function GET() {
    const challenge = await createAltchaCommentChallenge()
    return NextResponse.json(challenge)
}
