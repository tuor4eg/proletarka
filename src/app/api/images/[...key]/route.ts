import { isUploadKey } from "@/lib/imageUrl"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
    const { key: segments } = await context.params
    if (segments.some((segment) => segment.includes("/")) || !isUploadKey(segments.join("/"))) {
        return new Response("Invalid image key", { status: 400 })
    }

    const publicUrl = process.env.S3_PUBLIC_URL
    if (!publicUrl) return new Response("Image storage is not configured", { status: 503 })

    let target: URL
    try {
        target = new URL(publicUrl)
        if (!["http:", "https:"].includes(target.protocol) || target.search || target.hash) {
            throw new Error("Invalid public URL")
        }
        target.pathname = `${target.pathname.replace(/\/+$/, "")}/${segments.map(encodeURIComponent).join("/")}`
    } catch {
        return new Response("Image storage is not configured", { status: 503 })
    }

    return new Response(null, {
        status: 307,
        headers: { Location: target.toString(), "Cache-Control": "no-store" },
    })
}
