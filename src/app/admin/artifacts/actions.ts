"use server"

import { redirect } from "next/navigation"
import { eq, asc, max, and } from "drizzle-orm"
import { db } from "@/db"
import { artifacts, entities, materials, entityTopics, artifactSections, artifactMaterials } from "@/db/schema"
import { generateCode } from "@/lib/generateCode"
import { resolveImageUpload, deleteImage } from "@/lib/s3"
import { flashParam } from "@/lib/flash"

const CODE_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

export async function createArtifact(formData: FormData) {
    const title = (formData.get("title") as string).trim()
    const description = (formData.get("description") as string) || null
    const yearsLabel = (formData.get("yearsLabel") as string) || null
    const yearFromRaw = formData.get("yearFrom") as string
    const yearToRaw = formData.get("yearTo") as string
    const yearFrom = yearFromRaw ? Number(yearFromRaw) : null
    const yearTo = yearToRaw ? Number(yearToRaw) : null
    const artifactTypeRaw = formData.get("artifactType") as string
    const artifactType = artifactTypeRaw === "stand" ? "stand" : artifactTypeRaw === "rarity" ? "rarity" : artifactTypeRaw === "fund" ? "fund" : "general"
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
        .values({ code, title, description, yearsLabel, yearFrom, yearTo, artifactType, coverImagePath })
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

    redirect(`/admin/artifacts/${code}${flashParam("Исторический объект добавлен")}`)
}

export async function updateArtifact(artifactId: number, formData: FormData) {
    const title = (formData.get("title") as string).trim()
    const description = (formData.get("description") as string) || null
    const yearsLabel = (formData.get("yearsLabel") as string) || null
    const yearFromRaw = formData.get("yearFrom") as string
    const yearToRaw = formData.get("yearTo") as string
    const yearFrom = yearFromRaw ? Number(yearFromRaw) : null
    const yearTo = yearToRaw ? Number(yearToRaw) : null
    const artifactTypeRaw = formData.get("artifactType") as string
    const artifactType = artifactTypeRaw === "stand" ? "stand" : artifactTypeRaw === "rarity" ? "rarity" : artifactTypeRaw === "fund" ? "fund" : "general"
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

    const [[entity], [updatedArtifact]] = await Promise.all([
        db
            .select({ id: entities.id })
            .from(entities)
            .where(eq(entities.artifactId, artifactId))
            .limit(1),
        db
            .update(artifacts)
            .set({ title, description, yearsLabel, yearFrom, yearTo, artifactType, coverImagePath, updatedAt: new Date() })
            .where(eq(artifacts.id, artifactId))
            .returning({ code: artifacts.code }),
    ])

    if (!entity?.id) redirect("/admin/artifacts")

    await db.delete(entityTopics).where(eq(entityTopics.entityId, entity.id))
    if (topicIds.length > 0) {
        await db
            .insert(entityTopics)
            .values(topicIds.map((topicId) => ({ entityId: entity.id, topicId })))
    }

    redirect(`/admin/artifacts/${updatedArtifact.code}${flashParam("Сохранено")}`)
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

export async function createSection(artifactId: number, formData: FormData) {
    const title = (formData.get("title") as string).trim()
    if (!title) return

    const [result] = await db
        .select({ maxPos: max(artifactSections.position) })
        .from(artifactSections)
        .where(eq(artifactSections.artifactId, artifactId))

    const position = (result?.maxPos ?? 0) + 1

    await db.insert(artifactSections).values({ artifactId, title, position })

    const [artifact] = await db
        .select({ code: artifacts.code })
        .from(artifacts)
        .where(eq(artifacts.id, artifactId))
        .limit(1)

    redirect(`/admin/artifacts/${artifact.code}`)
}

export async function updateSection(sectionId: number, formData: FormData) {
    const title = (formData.get("title") as string).trim()
    if (!title) return

    const [section] = await db
        .select({ artifactId: artifactSections.artifactId })
        .from(artifactSections)
        .where(eq(artifactSections.id, sectionId))
        .limit(1)

    await db.update(artifactSections).set({ title }).where(eq(artifactSections.id, sectionId))

    const [artifact] = await db
        .select({ code: artifacts.code })
        .from(artifacts)
        .where(eq(artifacts.id, section.artifactId))
        .limit(1)

    redirect(`/admin/artifacts/${artifact.code}`)
}

export async function deleteSection(sectionId: number) {
    const [section] = await db
        .select({ artifactId: artifactSections.artifactId })
        .from(artifactSections)
        .where(eq(artifactSections.id, sectionId))
        .limit(1)

    await db.update(materials).set({ sectionId: null }).where(eq(materials.sectionId, sectionId))
    await db.delete(artifactSections).where(eq(artifactSections.id, sectionId))

    const [artifact] = await db
        .select({ code: artifacts.code })
        .from(artifacts)
        .where(eq(artifacts.id, section.artifactId))
        .limit(1)

    redirect(`/admin/artifacts/${artifact.code}`)
}

export async function updateSectionPositions(items: { id: number; position: number }[]) {
    await db.transaction(async (tx) => {
        for (const { id, position } of items) {
            await tx.update(artifactSections).set({ position }).where(eq(artifactSections.id, id))
        }
    })
}

export async function shiftSection(sectionId: number, direction: "up" | "down") {
    const [section] = await db
        .select()
        .from(artifactSections)
        .where(eq(artifactSections.id, sectionId))
        .limit(1)

    if (!section) return

    const siblings = await db
        .select()
        .from(artifactSections)
        .where(eq(artifactSections.artifactId, section.artifactId))
        .orderBy(asc(artifactSections.position))

    const index = siblings.findIndex((s) => s.id === sectionId)
    const swapIndex = direction === "up" ? index - 1 : index + 1

    if (swapIndex < 0 || swapIndex >= siblings.length) return

    const a = siblings[index]
    const b = siblings[swapIndex]

    await db.transaction(async (tx) => {
        await tx.update(artifactSections).set({ position: b.position }).where(eq(artifactSections.id, a.id))
        await tx.update(artifactSections).set({ position: a.position }).where(eq(artifactSections.id, b.id))
    })

    const [artifact] = await db
        .select({ code: artifacts.code })
        .from(artifacts)
        .where(eq(artifacts.id, section.artifactId))
        .limit(1)

    redirect(`/admin/artifacts/${artifact.code}`)
}

export async function updateMaterialSection(materialId: number, sectionId: number | null) {
    await db
        .update(materials)
        .set({ sectionId, updatedAt: new Date() })
        .where(eq(materials.id, materialId))
}

export async function linkMaterial(artifactId: number, materialId: number, sectionId: number | null) {
    await db
        .insert(artifactMaterials)
        .values({ artifactId, materialId, sectionId })
        .onConflictDoNothing()

    const [artifact] = await db
        .select({ code: artifacts.code })
        .from(artifacts)
        .where(eq(artifacts.id, artifactId))
        .limit(1)

    redirect(`/admin/artifacts/${artifact.code}${flashParam("Материал привязан")}`)
}

export async function unlinkMaterial(artifactId: number, materialId: number) {
    await db
        .delete(artifactMaterials)
        .where(and(eq(artifactMaterials.artifactId, artifactId), eq(artifactMaterials.materialId, materialId)))

    const [artifact] = await db
        .select({ code: artifacts.code })
        .from(artifacts)
        .where(eq(artifacts.id, artifactId))
        .limit(1)

    redirect(`/admin/artifacts/${artifact.code}${flashParam("Материал отвязан")}`)
}

export async function updateLinkedMaterialPositions(
    artifactId: number,
    items: { materialId: number; position: number }[]
) {
    for (const { materialId, position } of items) {
        await db
            .update(artifactMaterials)
            .set({ position })
            .where(and(eq(artifactMaterials.artifactId, artifactId), eq(artifactMaterials.materialId, materialId)))
    }
}

export async function updateLinkedMaterialSection(artifactId: number, materialId: number, sectionId: number | null) {
    await db
        .update(artifactMaterials)
        .set({ sectionId })
        .where(and(eq(artifactMaterials.artifactId, artifactId), eq(artifactMaterials.materialId, materialId)))
}
