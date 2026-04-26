import { and, asc, eq, ilike, inArray, isNotNull, or, sql } from "drizzle-orm"
import { db } from "@/db"
import { materials, materialSources, sources, topics } from "@/db/schema"

export type SourceLink = {
    id: number
    label: string
    url: string
}

export type TopicTreeItem = {
    id: number
    code: string
    title: string
    parentId: number | null
    isSystem: boolean
    children: TopicTreeItem[]
}

export type SourceSearchItem = {
    label: string
    url: string
}

export type ImportTopicItem = {
    code: string
    title: string
    parentCode: string | null
    isSystem: boolean
}

export async function fetchFirstPhotoMap(entityIds: number[]): Promise<Map<number, string>> {
    if (entityIds.length === 0) return new Map()

    const rows = await db
        .selectDistinctOn([materials.entityId], {
            entityId: materials.entityId,
            coverImagePath: materials.coverImagePath,
        })
        .from(materials)
        .where(
            and(
                inArray(materials.entityId, entityIds),
                eq(materials.materialType, "photo"),
                isNotNull(materials.coverImagePath),
                eq(materials.status, "published"),
            ),
        )
        .orderBy(materials.entityId, sql`${materials.position} ASC NULLS LAST`, asc(materials.id))

    return new Map(
        rows.filter((r) => r.entityId !== null).map((r) => [r.entityId!, r.coverImagePath!]),
    )
}

export async function fetchMaterialSourcesMap(
    materialIds: number[],
): Promise<Map<number, SourceLink[]>> {
    if (materialIds.length === 0) return new Map()

    const rows = await db
        .select({
            materialId: materialSources.materialId,
            sourceId: sources.id,
            label: sources.label,
            url: sources.url,
        })
        .from(materialSources)
        .innerJoin(sources, eq(materialSources.sourceId, sources.id))
        .where(inArray(materialSources.materialId, materialIds))
        .orderBy(asc(sources.label), asc(sources.id))

    const map = new Map<number, SourceLink[]>()

    for (const row of rows) {
        if (!map.has(row.materialId)) {
            map.set(row.materialId, [])
        }

        map.get(row.materialId)!.push({
            id: row.sourceId,
            label: row.label,
            url: row.url,
        })
    }

    return map
}

export async function fetchTopicTree(): Promise<TopicTreeItem[]> {
    const rows = await db
        .select({
            id: topics.id,
            code: topics.code,
            title: topics.title,
            parentId: topics.parentId,
            isSystem: topics.isSystem,
        })
        .from(topics)
        .orderBy(asc(topics.title), asc(topics.id))

    const byId = new Map<number, TopicTreeItem>()

    for (const row of rows) {
        byId.set(row.id, {
            id: row.id,
            code: row.code,
            title: row.title,
            parentId: row.parentId,
            isSystem: row.isSystem,
            children: [],
        })
    }

    const roots: TopicTreeItem[] = []

    for (const topic of byId.values()) {
        if (topic.parentId === null) {
            roots.push(topic)
            continue
        }

        const parent = byId.get(topic.parentId)
        if (parent) {
            parent.children.push(topic)
        } else {
            roots.push(topic)
        }
    }

    return roots
}

export async function fetchImportTopics(): Promise<ImportTopicItem[]> {
    const tree = await fetchTopicTree()
    const result: ImportTopicItem[] = []

    function visit(topic: TopicTreeItem, parentCode: string | null) {
        result.push({
            code: topic.code,
            title: topic.title,
            parentCode,
            isSystem: topic.isSystem,
        })

        for (const child of topic.children) {
            visit(child, topic.code)
        }
    }

    for (const topic of tree) {
        visit(topic, null)
    }

    return result
}

export async function searchSources(q: string, limit: number): Promise<SourceSearchItem[]> {
    const trimmedQ = q.trim()
    const where =
        trimmedQ.length >= 2
            ? or(ilike(sources.label, `%${trimmedQ}%`), ilike(sources.url, `%${trimmedQ}%`))
            : undefined

    return db
        .selectDistinct({
            label: sources.label,
            url: sources.url,
        })
        .from(sources)
        .where(where)
        .orderBy(asc(sources.label), asc(sources.url))
        .limit(limit)
}
