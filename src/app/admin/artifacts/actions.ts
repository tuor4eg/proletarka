"use server"

import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { artifacts, entities, materials, entityTopics } from "@/db/schema"
import { generateCode } from "@/lib/generateCode"
import { resolveImageUpload, deleteImage } from "@/lib/s3"
import { flashParam } from "@/lib/flash"

const CODE_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

export async function createArtifact(formData: FormData) {
    const title = (formData.get("title") as string).trim()
    const description = (formData.get("description") as string) || null
    const yearsLabel = (formData.get("yearsLabel") as string) || null
    const artifactType = (formData.get("artifactType") as string) === "stand" ? "stand" : "general"
    const coverImagePath = await resolveImageUpload(formData, "coverImageFile", "coverImagePath")
    const topicIds = formData.getAll("topicIds").map(Number).filter(Boolean)

    const customCodeRaw = (formData.get("customCode") as string)?.trim()
    let code: string

    if (customCodeRaw) {
        if (!CODE_PATTERN.test(customCodeRaw)) {
            redirect(`/admin/artifacts/new${flashParam("Недопустимый формат code")}`)
        }
        const existing = await db
            .select({ id: artifacts.id })
            .from(artifacts)
            .where(eq(artifacts.code, customCodeRaw))
            .limit(1)
        if (existing.length > 0) {
            redirect(`/admin/artifacts/new${flashParam("Этот code уже занят")}`)
        }
        code = customCodeRaw
    } else {
        code = generateCode(title)
    }

    const [artifact] = await db
        .insert(artifacts)
        .values({ code, title, description, yearsLabel, artifactType, coverImagePath })
        .returning({ id: artifacts.id })

    const [entity] = await db
        .insert(entities)
        .values({ type: "artifact", artifactId: artifact.id, code })
        .returning({ id: entities.id })

    if (topicIds.length > 0) {
        await db
            .insert(entityTopics)
            .values(topicIds.map((topicId) => ({ entityId: entity.id, topicId })))
    }

    redirect(`/admin/artifacts/${entity.id}${flashParam("Исторический объект добавлен")}`)
}

export async function updateArtifact(artifactId: number, formData: FormData) {
    const title = (formData.get("title") as string).trim()
    const description = (formData.get("description") as string) || null
    const yearsLabel = (formData.get("yearsLabel") as string) || null
    const artifactType = (formData.get("artifactType") as string) === "stand" ? "stand" : "general"
    const topicIds = formData.getAll("topicIds").map(Number).filter(Boolean)

    const [current] = await db
        .select({ coverImagePath: artifacts.coverImagePath })
        .from(artifacts)
        .where(eq(artifacts.id, artifactId))
        .limit(1)

    const coverImagePath = await resolveImageUpload(formData, "coverImageFile", "coverImagePath")

    if (current?.coverImagePath && current.coverImagePath !== coverImagePath) {
        await deleteImage(current.coverImagePath)
    }

    const [[entity]] = await Promise.all([
        db
            .select({ id: entities.id })
            .from(entities)
            .where(eq(entities.artifactId, artifactId))
            .limit(1),
        db
            .update(artifacts)
            .set({ title, description, yearsLabel, artifactType, coverImagePath, updatedAt: new Date() })
            .where(eq(artifacts.id, artifactId)),
    ])

    if (!entity?.id) redirect("/admin/artifacts")

    await db.delete(entityTopics).where(eq(entityTopics.entityId, entity.id))
    if (topicIds.length > 0) {
        await db
            .insert(entityTopics)
            .values(topicIds.map((topicId) => ({ entityId: entity.id, topicId })))
    }

    redirect(`/admin/artifacts/${entity.id}${flashParam("Сохранено")}`)
}

export async function deleteArtifact(entityId: number) {
    await db.delete(entities).where(eq(entities.id, entityId))
    redirect(`/admin/artifacts${flashParam("Удалено")}`)
}

export async function updateMaterialPositions(items: { id: number; position: number }[]) {
    await db.transaction(async (tx) => {
        for (const { id, position } of items) {
            await tx.update(materials).set({ position }).where(eq(materials.id, id))
        }
    })
}
