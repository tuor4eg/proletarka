"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { comments, type CommentStatus } from "@/db/schema"
import { getCommentTargetByEntityId } from "@/app/comments/queries"
import { requireAdmin, type AdminUser } from "@/lib/adminAuth"

async function revalidateCommentPaths(entityId: number) {
    const target = await getCommentTargetByEntityId(entityId)

    revalidatePath("/admin/comments")
    if (target) {
        revalidatePath(target.publicPath)
    }
}

async function setCommentStatus(id: number, status: CommentStatus, user: AdminUser) {
    const [updated] = await db
        .update(comments)
        .set({
            status,
            moderatedAt: new Date(),
            moderatedBy: user.id,
        })
        .where(eq(comments.id, id))
        .returning({
            id: comments.id,
            entityId: comments.entityId,
        })

    if (!updated) return

    await revalidateCommentPaths(updated.entityId)
}

export async function approveComment(id: number) {
    const user = await requireAdmin()
    await setCommentStatus(id, "approved", user)
}

export async function hideComment(id: number) {
    const user = await requireAdmin()
    await setCommentStatus(id, "hidden", user)
}

export async function deleteComment(id: number) {
    await requireAdmin()

    const [deleted] = await db.delete(comments).where(eq(comments.id, id)).returning({
        id: comments.id,
        entityId: comments.entityId,
    })

    if (!deleted) return

    await revalidateCommentPaths(deleted.entityId)
}
