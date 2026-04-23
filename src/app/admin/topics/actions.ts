"use server"

import { redirect } from "next/navigation"
import { eq, count } from "drizzle-orm"
import { db } from "@/db"
import { topics } from "@/db/schema"
import { getTopicUsageCounts } from "@/lib/adminTopics"
import { flashParam } from "@/lib/flash"
import { logAdminAction } from "@/lib/logAdminAction"
import { generateCode, CODE_PATTERN } from "@/lib/generateCode"

const RESERVED_SYSTEM_TOPIC_CODES = new Set([
    "war",
    "factory",
    "war-mobilization",
    "war-demobilization",
    "war-killed",
    "war-234-division",
    "war-home-front-workers",
    "war-prisoners",
    "war-partisans",
    "factory-hired",
    "factory-dismissed",
])

type ParentValidationResult = { parentId: number | null } | { error: string }

async function parseAndValidateParentId(
    parentIdRaw: FormDataEntryValue | null,
    currentId?: number,
): Promise<ParentValidationResult> {
    const raw = typeof parentIdRaw === "string" ? parentIdRaw : ""
    const parentId = raw ? Number(raw) : null

    if (parentId === null) return { parentId: null }
    if (!Number.isInteger(parentId) || parentId <= 0) {
        return { error: "Некорректная родительская тема" as const }
    }
    if (currentId && parentId === currentId) {
        return { error: "Тема не может быть родителем самой себе" as const }
    }

    const [parent] = await db
        .select({ id: topics.id, parentId: topics.parentId })
        .from(topics)
        .where(eq(topics.id, parentId))
        .limit(1)

    if (!parent) {
        return { error: "Родительская тема не найдена" as const }
    }
    if (parent.parentId !== null) {
        return { error: "Подтемы можно привязывать только к корневой теме" as const }
    }

    return { parentId }
}

export async function createTopic(formData: FormData) {
    const title = (formData.get("title") as string).trim()
    const customCodeRaw = (formData.get("customCode") as string)?.trim()
    const parentResult = await parseAndValidateParentId(formData.get("parentId"))
    const generatedCode = generateCode(title)
    let code = generatedCode

    if ("error" in parentResult) {
        redirect(`/admin/topics/new${flashParam(parentResult.error, "error")}`)
    }

    if (customCodeRaw) {
        if (!CODE_PATTERN.test(customCodeRaw)) {
            redirect(`/admin/topics/new${flashParam("Недопустимый формат code")}`)
        }
        const existing = await db
            .select({ id: topics.id })
            .from(topics)
            .where(eq(topics.code, customCodeRaw))
            .limit(1)
        if (existing.length > 0) {
            redirect(`/admin/topics/new${flashParam("Этот code уже занят")}`)
        }
        if (RESERVED_SYSTEM_TOPIC_CODES.has(customCodeRaw)) {
            redirect(
                `/admin/topics/new${flashParam("Этот code зарезервирован для системной темы", "error")}`,
            )
        }
        code = customCodeRaw
    } else if (RESERVED_SYSTEM_TOPIC_CODES.has(generatedCode)) {
        redirect(
            `/admin/topics/new${flashParam("Этот code зарезервирован для системной темы", "error")}`,
        )
    }

    const [inserted] = await db
        .insert(topics)
        .values({ code, title, parentId: parentResult.parentId })
        .returning({ id: topics.id })
    await logAdminAction("create", "topic", inserted.id, title)
    redirect(`/admin/topics/${inserted.id}${flashParam("Тема создана")}`)
}

export async function updateTopic(id: number, formData: FormData) {
    const title = (formData.get("title") as string).trim()
    const [[currentTopic], [{ childCount }]] = await Promise.all([
        db
            .select({
                isSystem: topics.isSystem,
                parentId: topics.parentId,
            })
            .from(topics)
            .where(eq(topics.id, id))
            .limit(1),
        db.select({ childCount: count() }).from(topics).where(eq(topics.parentId, id)),
    ])
    const parentResult = currentTopic?.isSystem
        ? { parentId: currentTopic.parentId }
        : await parseAndValidateParentId(formData.get("parentId"), id)

    if ("error" in parentResult) {
        redirect(`/admin/topics/${id}${flashParam(parentResult.error, "error")}`)
    }
    if (currentTopic?.isSystem && parentResult.parentId !== currentTopic.parentId) {
        redirect(
            `/admin/topics/${id}${flashParam("У системной темы нельзя менять родителя", "error")}`,
        )
    }
    if (parentResult.parentId !== null && childCount > 0) {
        redirect(
            `/admin/topics/${id}${flashParam("Тему с подтемами нельзя сделать подтемой", "error")}`,
        )
    }

    await db.update(topics).set({ title, parentId: parentResult.parentId }).where(eq(topics.id, id))
    await logAdminAction("update", "topic", id, title)
    redirect(`/admin/topics/${id}${flashParam("Сохранено")}`)
}

export async function deleteTopic(id: number) {
    const [[{ childCount }], [topicToDelete], usageCounts] = await Promise.all([
        db.select({ childCount: count() }).from(topics).where(eq(topics.parentId, id)),
        db
            .select({ title: topics.title, isSystem: topics.isSystem })
            .from(topics)
            .where(eq(topics.id, id))
            .limit(1),
        getTopicUsageCounts(id),
    ])
    const { materialCount, eventCount, entityCount } = usageCounts

    if (topicToDelete?.isSystem) {
        redirect(`/admin/topics${flashParam("Системную тему нельзя удалить", "error")}`)
    }
    if (materialCount > 0) {
        redirect(`/admin/topics${flashParam("Нельзя удалить тему с материалами", "error")}`)
    }
    if (eventCount > 0) {
        redirect(`/admin/topics${flashParam("Нельзя удалить тему с событиями", "error")}`)
    }
    if (entityCount > 0) {
        redirect(`/admin/topics${flashParam("Нельзя удалить тему с объектами", "error")}`)
    }
    if (childCount > 0) {
        redirect(`/admin/topics${flashParam("Нельзя удалить тему с подтемами", "error")}`)
    }

    await db.delete(topics).where(eq(topics.id, id))
    await logAdminAction("delete", "topic", id, topicToDelete?.title ?? null)
    redirect(`/admin/topics${flashParam("Тема удалена")}`)
}
