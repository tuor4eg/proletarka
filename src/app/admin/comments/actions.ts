"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { comments, type CommentStatus } from "@/db/schema"
import { getCommentTargetByEntityId } from "@/app/comments/queries"
import { getSession } from "@/lib/session"

async function requireAdminSession() {
    const session = await getSession()
    if (!session) redirect("/admin/login")
    return session
}

async function revalidateCommentPaths(entityId: number) {
    const target = await getCommentTargetByEntityId(entityId)

    revalidatePath("/admin/comments")
    if (target) {
        revalidatePath(target.publicPath)
    }
}

async function setCommentStatus(id: number, status: CommentStatus) {
    const session = await requireAdminSession()

    const [updated] = await db
        .update(comments)
        .set({
            status,
            moderatedAt: new Date(),
            moderatedBy: session.userId,
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
    await setCommentStatus(id, "approved")
}

export async function hideComment(id: number) {
    await setCommentStatus(id, "hidden")
}

export async function deleteComment(id: number) {
    await requireAdminSession()

    const [deleted] = await db.delete(comments).where(eq(comments.id, id)).returning({
        id: comments.id,
        entityId: comments.entityId,
    })

    if (!deleted) return

    await revalidateCommentPaths(deleted.entityId)
}
