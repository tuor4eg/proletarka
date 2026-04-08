import { and, asc, count, desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { comments, entities, people, artifacts } from "@/db/schema"

export type CommentTarget = {
    entityId: number
    code: string
    type: "person" | "artifact"
    title: string
    publicPath: string
}

export type PublicComment = {
    id: number
    author: string | null
    body: string
    createdAt: Date
}

export type PaginatedComments = {
    items: PublicComment[]
    total: number
}

export type CommentsSort = "date_desc" | "date_asc"

export async function getCommentTargetByEntityId(entityId: number): Promise<CommentTarget | null> {
    const [row] = await db
        .select({
            entityId: entities.id,
            code: entities.code,
            type: entities.type,
            personName: people.name,
            artifactTitle: artifacts.title,
        })
        .from(entities)
        .leftJoin(people, eq(entities.personId, people.id))
        .leftJoin(artifacts, eq(entities.artifactId, artifacts.id))
        .where(eq(entities.id, entityId))
        .limit(1)

    if (!row) return null

    if (row.type === "person" && row.personName) {
        return {
            entityId: row.entityId,
            code: row.code,
            type: "person",
            title: row.personName,
            publicPath: `/people/${row.code}`,
        }
    }

    if (row.type === "artifact" && row.artifactTitle) {
        return {
            entityId: row.entityId,
            code: row.code,
            type: "artifact",
            title: row.artifactTitle,
            publicPath: `/artifacts/${row.code}`,
        }
    }

    return null
}

export async function getApprovedCommentsByEntityId(
    entityId: number,
    options?: {
        limit?: number
        offset?: number
        sort?: CommentsSort
    },
): Promise<PaginatedComments> {
    const where = and(eq(comments.entityId, entityId), eq(comments.status, "approved"))
    const orderBy =
        options?.sort === "date_asc"
            ? [asc(comments.createdAt), asc(comments.id)]
            : [desc(comments.createdAt), desc(comments.id)]

    const [items, [{ total }]] = await Promise.all([
        db
            .select({
                id: comments.id,
                author: comments.author,
                body: comments.body,
                createdAt: comments.createdAt,
            })
            .from(comments)
            .where(where)
            .orderBy(...orderBy)
            .limit(options?.limit ?? 1000)
            .offset(options?.offset ?? 0),
        db.select({ total: count() }).from(comments).where(where),
    ])

    return {
        items,
        total,
    }
}
