"use server"

import { redirect } from "next/navigation"
import { eq, count } from "drizzle-orm"
import { db } from "@/db"
import { topics, materialTopics } from "@/db/schema"
import { flashParam } from "@/lib/flash"
import { logAdminAction } from "@/lib/logAdminAction"
import { generateCode, CODE_PATTERN } from "@/lib/generateCode"

export async function createTopic(formData: FormData) {
    const title = (formData.get("title") as string).trim()
    const customCodeRaw = (formData.get("customCode") as string)?.trim()
    let code: string

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
        code = customCodeRaw
    } else {
        code = generateCode(title)
    }

    const [inserted] = await db.insert(topics).values({ code, title }).returning({ id: topics.id })
    await logAdminAction("create", "topic", inserted.id, title)
    redirect(`/admin/topics/${inserted.id}${flashParam("Тема создана")}`)
}

export async function updateTopic(id: number, formData: FormData) {
    const title = (formData.get("title") as string).trim()
    await db.update(topics).set({ title }).where(eq(topics.id, id))
    await logAdminAction("update", "topic", id, title)
    redirect(`/admin/topics/${id}${flashParam("Сохранено")}`)
}

export async function deleteTopic(id: number) {
    const [[{ materialCount }], [topicToDelete]] = await Promise.all([
        db
            .select({ materialCount: count(materialTopics.materialId) })
            .from(materialTopics)
            .where(eq(materialTopics.topicId, id)),
        db.select({ title: topics.title }).from(topics).where(eq(topics.id, id)).limit(1),
    ])

    if (materialCount > 0) {
        redirect(`/admin/topics${flashParam("Нельзя удалить тему с материалами", "error")}`)
    }

    await db.delete(topics).where(eq(topics.id, id))
    await logAdminAction("delete", "topic", id, topicToDelete?.title ?? null)
    redirect(`/admin/topics${flashParam("Тема удалена")}`)
}
