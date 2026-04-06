import { db } from "@/db"
import { adminLogs } from "@/db/schema"
import { getSession } from "@/lib/session"

type AdminAction = "create" | "update" | "delete" | "publish" | "unpublish"
type AdminEntityType = "person" | "artifact" | "artifactSection" | "material" | "topic"

export async function logAdminAction(
    action: AdminAction,
    entityType: AdminEntityType,
    entityId: number | null,
    entityTitle: string | null,
) {
    const session = await getSession()
    if (!session) return

    await db.insert(adminLogs).values({
        userId: session.userId,
        action,
        entityType,
        entityId,
        entityTitle,
    })
}
