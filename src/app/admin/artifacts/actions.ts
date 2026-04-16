"use server"

import { redirect } from "next/navigation"
import { eq, asc, max, and } from "drizzle-orm"
import { db } from "@/db"
import {
    artifacts,
    entities,
    materials,
    entityTopics,
    artifactSections,
    artifactMaterials,
    type ArtifactType,
} from "@/db/schema"
import { generateCode, CODE_PATTERN } from "@/lib/generateCode"
import { resolveImageUpload, deleteImage } from "@/lib/s3"
import { flashParam } from "@/lib/flash"
import { logAdminAction } from "@/lib/logAdminAction"
import { validateTopicSelection } from "@/lib/topicValidation"

const ARTIFACT_TYPES: ArtifactType[] = ["stand", "rarity", "fund", "general"]

function parseArtifactType(raw: string): ArtifactType {
    return (ARTIFACT_TYPES.find((t) => t === raw) ?? "general") as ArtifactType
}

export async function createArtifact(formData: FormData) {
    const title = (formData.get("title") as string).trim()
    const description = (formData.get("description") as string) || null
    const yearsLabel = (formData.get("yearsLabel") as string) || null
    const yearFromRaw = formData.get("yearFrom") as string
    const yearToRaw = formData.get("yearTo") as string
    const yearFrom = yearFromRaw ? Number(yearFromRaw) : null
    const yearTo = yearToRaw ? Number(yearToRaw) : null
    const artifactType = parseArtifactType(formData.get("artifactType") as string)
    const coverImagePath = await resolveImageUpload(formData, "coverImageFile", "coverImagePath")
    const topicIds = formData.getAll("topicIds").map(Number).filter(Boolean)
    const topicValidation = await validateTopicSelection(topicIds)

    if (!topicValidation.ok) {
        redirect(`/admin/artifacts/new${flashParam(topicValidation.message, "error")}`)
    }

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
        .values({
            code,
            title,
            description,
            yearsLabel,
            yearFrom,
            yearTo,
            artifactType,
            coverImagePath,
        })
        .returning({ id: artifacts.id })

    const [entity] = await db
        .insert(entities)
        .values({ type: "artifact", artifactId: artifact.id, code })
        .returning({ id: entities.id })

    if (topicValidation.topicIds.length > 0) {
        await db
            .insert(entityTopics)
            .values(topicValidation.topicIds.map((topicId) => ({ entityId: entity.id, topicId })))
    }

    await logAdminAction("create", "artifact", artifact.id, title)
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
    const artifactType = parseArtifactType(formData.get("artifactType") as string)
    const topicIds = formData.getAll("topicIds").map(Number).filter(Boolean)
    const topicValidation = await validateTopicSelection(topicIds)

    const [current] = await db
        .select({ coverImagePath: artifacts.coverImagePath })
        .from(artifacts)
        .where(eq(artifacts.id, artifactId))
        .limit(1)

    if (!topicValidation.ok) {
        const [artifact] = await db
            .select({ code: artifacts.code })
            .from(artifacts)
            .where(eq(artifacts.id, artifactId))
            .limit(1)
        redirect(
            `/admin/artifacts/${artifact?.code ?? artifactId}${flashParam(topicValidation.message, "error")}`,
        )
    }

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
            .set({
                title,
                description,
                yearsLabel,
                yearFrom,
                yearTo,
                artifactType,
                coverImagePath,
                updatedAt: new Date(),
            })
            .where(eq(artifacts.id, artifactId))
            .returning({ code: artifacts.code }),
    ])

    if (!entity?.id) redirect("/admin/artifacts")

    await db.delete(entityTopics).where(eq(entityTopics.entityId, entity.id))
    if (topicValidation.topicIds.length > 0) {
        await db
            .insert(entityTopics)
            .values(topicValidation.topicIds.map((topicId) => ({ entityId: entity.id, topicId })))
    }

    await logAdminAction("update", "artifact", artifactId, title)
    redirect(`/admin/artifacts/${updatedArtifact.code}${flashParam("Сохранено")}`)
}

export async function deleteArtifact(entityId: number) {
    const [entityRow] = await db
        .select({ artifactId: entities.artifactId })
        .from(entities)
        .where(eq(entities.id, entityId))
        .limit(1)
    const artifactId = entityRow?.artifactId ?? null
    let artifactTitle: string | null = null
    if (artifactId) {
        const [row] = await db
            .select({ title: artifacts.title })
            .from(artifacts)
            .where(eq(artifacts.id, artifactId))
            .limit(1)
        artifactTitle = row?.title ?? null
    }
    await db.delete(entities).where(eq(entities.id, entityId))
    await logAdminAction("delete", "artifact", artifactId, artifactTitle)
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

    const [section] = await db
        .insert(artifactSections)
        .values({ artifactId, title, position })
        .returning({ id: artifactSections.id })

    const [artifact] = await db
        .select({ code: artifacts.code })
        .from(artifacts)
        .where(eq(artifacts.id, artifactId))
        .limit(1)

    await logAdminAction("create", "artifactSection", section.id, title)
    redirect(`/admin/artifacts/${artifact.code}`)
}

export async function updateSection(sectionId: number, formData: FormData) {
    const title = (formData.get("title") as string).trim()
    if (!title) return
    const description = (formData.get("description") as string | null)?.trim() || null

    const [section] = await db
        .select({ artifactId: artifactSections.artifactId })
        .from(artifactSections)
        .where(eq(artifactSections.id, sectionId))
        .limit(1)

    await db
        .update(artifactSections)
        .set({ title, description })
        .where(eq(artifactSections.id, sectionId))

    const [artifact] = await db
        .select({ code: artifacts.code })
        .from(artifacts)
        .where(eq(artifacts.id, section.artifactId))
        .limit(1)

    await logAdminAction("update", "artifactSection", sectionId, title)
    redirect(`/admin/artifacts/${artifact.code}`)
}

export async function deleteSection(sectionId: number) {
    const [section] = await db
        .select({ artifactId: artifactSections.artifactId, title: artifactSections.title })
        .from(artifactSections)
        .where(eq(artifactSections.id, sectionId))
        .limit(1)

    await db.update(materials).set({ sectionId: null }).where(eq(materials.sectionId, sectionId))
    await db.delete(artifactSections).where(eq(artifactSections.id, sectionId))
    await logAdminAction("delete", "artifactSection", sectionId, section?.title ?? null)

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
        await tx
            .update(artifactSections)
            .set({ position: b.position })
            .where(eq(artifactSections.id, a.id))
        await tx
            .update(artifactSections)
            .set({ position: a.position })
            .where(eq(artifactSections.id, b.id))
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

export async function linkMaterial(
    artifactId: number,
    materialId: number,
    sectionId: number | null,
) {
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
        .where(
            and(
                eq(artifactMaterials.artifactId, artifactId),
                eq(artifactMaterials.materialId, materialId),
            ),
        )

    const [artifact] = await db
        .select({ code: artifacts.code })
        .from(artifacts)
        .where(eq(artifacts.id, artifactId))
        .limit(1)

    redirect(`/admin/artifacts/${artifact.code}${flashParam("Материал отвязан")}`)
}

export async function updateLinkedMaterialPositions(
    artifactId: number,
    items: { materialId: number; position: number }[],
) {
    for (const { materialId, position } of items) {
        await db
            .update(artifactMaterials)
            .set({ position })
            .where(
                and(
                    eq(artifactMaterials.artifactId, artifactId),
                    eq(artifactMaterials.materialId, materialId),
                ),
            )
    }
}

export async function updateLinkedMaterialSection(
    artifactId: number,
    materialId: number,
    sectionId: number | null,
) {
    await db
        .update(artifactMaterials)
        .set({ sectionId })
        .where(
            and(
                eq(artifactMaterials.artifactId, artifactId),
                eq(artifactMaterials.materialId, materialId),
            ),
        )
}
