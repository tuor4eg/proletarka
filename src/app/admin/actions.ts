"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { materials, materialTopics, type MaterialType, type Status } from "@/db/schema"
import { generateCode } from "@/lib/generateCode"
import { resolveImageUpload, deleteImage } from "@/lib/s3"
import { flashParam } from "@/lib/flash"
import { logAdminAction } from "@/lib/logAdminAction"

async function parseFormData(formData: FormData) {
    const yearFromRaw = formData.get("yearFrom") as string
    const yearToRaw = formData.get("yearTo") as string
    const entityIdRaw = formData.get("entityId") as string

    const sectionIdRaw = formData.get("sectionId") as string
    const materialType = formData.get("materialType") as MaterialType
    const isNews = materialType === "news"

    return {
        title: formData.get("title") as string,
        materialType,
        status: formData.get("status") as Status,
        entityId: isNews ? null : entityIdRaw ? Number(entityIdRaw) : null,
        sectionId: isNews ? null : sectionIdRaw ? Number(sectionIdRaw) : null,
        summary: isNews ? null : (formData.get("summary") as string) || null,
        content: (formData.get("content") as string) || null,
        sourceUrl: (formData.get("sourceUrl") as string) || null,
        coverImagePath: await resolveImageUpload(formData, "coverImageFile", "coverImagePath"),
        yearFrom: isNews ? null : yearFromRaw ? Number(yearFromRaw) : null,
        yearTo: isNews ? null : yearToRaw ? Number(yearToRaw) : null,
    }
}

function parseTopicIds(formData: FormData, materialType: MaterialType): number[] {
    if (materialType === "news") return []
    return formData.getAll("topicIds").map(Number).filter(Boolean)
}

export async function createMaterial(
    _prev: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    const values = await parseFormData(formData)
    const topicIds = parseTopicIds(formData, values.materialType)
    const code = generateCode(values.title)

    const [inserted] = await db
        .insert(materials)
        .values({ ...values, code })
        .returning({ id: materials.id })

    if (topicIds.length > 0) {
        await db
            .insert(materialTopics)
            .values(topicIds.map((topicId) => ({ materialId: inserted.id, topicId })))
    }

    await logAdminAction("create", "material", inserted.id, values.title)
    redirect(`/admin/${inserted.id}${flashParam("Материал создан")}`)
}

export type ActionResult = {
    message: string
    type: "success" | "error"
    status?: Status
    materialType?: MaterialType
} | null

export async function updateMaterial(
    id: number,
    _prev: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    const [current] = await db
        .select({ coverImagePath: materials.coverImagePath })
        .from(materials)
        .where(eq(materials.id, id))
        .limit(1)

    const values = await parseFormData(formData)
    const topicIds = parseTopicIds(formData, values.materialType)

    if (current?.coverImagePath && current.coverImagePath !== values.coverImagePath) {
        await deleteImage(current.coverImagePath)
    }

    await db
        .update(materials)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(materials.id, id))

    await db.delete(materialTopics).where(eq(materialTopics.materialId, id))
    if (topicIds.length > 0) {
        await db
            .insert(materialTopics)
            .values(topicIds.map((topicId) => ({ materialId: id, topicId })))
    }

    await logAdminAction("update", "material", id, values.title)
    revalidatePath("/admin", "layout")
    return {
        message: "Сохранено",
        type: "success",
        status: values.status,
        materialType: values.materialType,
    }
}

export async function toggleMaterialStatus(id: number, currentStatus: string) {
    const newStatus = currentStatus === "published" ? "draft" : "published"
    const [material] = await db
        .select({ title: materials.title })
        .from(materials)
        .where(eq(materials.id, id))
        .limit(1)
    await db
        .update(materials)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(materials.id, id))
    await logAdminAction(
        newStatus === "published" ? "publish" : "unpublish",
        "material",
        id,
        material?.title ?? null,
    )
    const label = newStatus === "published" ? "Опубликовано" : "Снято с публикации"
    redirect(`/admin${flashParam(label)}`)
}

export async function deleteMaterial(id: number) {
    const [current] = await db
        .select({ coverImagePath: materials.coverImagePath, title: materials.title })
        .from(materials)
        .where(eq(materials.id, id))
        .limit(1)

    if (current?.coverImagePath) {
        await deleteImage(current.coverImagePath)
    }

    await db.delete(materialTopics).where(eq(materialTopics.materialId, id))
    await db.delete(materials).where(eq(materials.id, id))
    await logAdminAction("delete", "material", id, current?.title ?? null)

    redirect(`/admin${flashParam("Материал удалён")}`)
}
