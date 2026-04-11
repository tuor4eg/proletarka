"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import {
    materials,
    materialTopics,
    personMaterials,
    type MaterialType,
    type Status,
} from "@/db/schema"
import { generateCode } from "@/lib/generateCode"
import { resolveImageUpload, deleteImage } from "@/lib/s3"
import { flashParam } from "@/lib/flash"
import { logAdminAction } from "@/lib/logAdminAction"
import { appendBackstackParam } from "@/lib/adminBackstack"

async function parseFormData(formData: FormData) {
    const yearFromRaw = formData.get("yearFrom") as string
    const yearToRaw = formData.get("yearTo") as string
    const entityIdRaw = formData.get("entityId") as string

    const sectionIdRaw = formData.get("sectionId") as string
    const materialType = formData.get("materialType") as MaterialType
    const isNews = materialType === "news"
    const isGroupPhoto = materialType === "group_photo"

    return {
        title: formData.get("title") as string,
        materialType,
        status: formData.get("status") as Status,
        entityId: isNews || isGroupPhoto ? null : entityIdRaw ? Number(entityIdRaw) : null,
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

function parsePersonIds(formData: FormData, materialType: MaterialType): number[] {
    if (materialType !== "group_photo") return []
    return Array.from(new Set(formData.getAll("personIds").map(Number).filter(Boolean)))
}

function validateGroupPhotoPeople(personIds: number[], materialType: MaterialType): ActionResult {
    if (materialType !== "group_photo") return null
    if (personIds.length >= 2) return null

    return {
        message: "Для группового фото нужно выбрать минимум двух человек",
        type: "error",
        materialType,
    }
}

export async function createMaterial(
    _prev: ActionResult,
    formData: FormData,
): Promise<ActionResult> {
    const backstack = (formData.get("backstack") as string) || undefined
    const values = await parseFormData(formData)
    const topicIds = parseTopicIds(formData, values.materialType)
    const personIds = parsePersonIds(formData, values.materialType)
    const groupPhotoValidation = validateGroupPhotoPeople(personIds, values.materialType)

    if (groupPhotoValidation) {
        return groupPhotoValidation
    }

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

    if (personIds.length > 0) {
        await db
            .insert(personMaterials)
            .values(personIds.map((personId) => ({ personId, materialId: inserted.id })))
    }

    await logAdminAction("create", "material", inserted.id, values.title)
    redirect(
        appendBackstackParam(`/admin/${inserted.id}${flashParam("Материал создан")}`, backstack),
    )
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
        .select({
            coverImagePath: materials.coverImagePath,
            materialType: materials.materialType,
        })
        .from(materials)
        .where(eq(materials.id, id))
        .limit(1)

    const values = await parseFormData(formData)

    if (current?.materialType !== values.materialType) {
        if (
            current?.materialType === "news" ||
            values.materialType === "news" ||
            current?.materialType === "group_photo" ||
            values.materialType === "group_photo"
        ) {
            return {
                message: "Тип новости и группового фото можно задать только при создании",
                type: "error",
                status: values.status,
                materialType: current?.materialType,
            }
        }
    }

    const topicIds = parseTopicIds(formData, values.materialType)
    const personIds = parsePersonIds(formData, values.materialType)
    const groupPhotoValidation = validateGroupPhotoPeople(personIds, values.materialType)

    if (groupPhotoValidation) {
        return {
            ...groupPhotoValidation,
            status: values.status,
            materialType: values.materialType,
        }
    }

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

    await db.delete(personMaterials).where(eq(personMaterials.materialId, id))
    if (personIds.length > 0) {
        await db
            .insert(personMaterials)
            .values(personIds.map((personId) => ({ personId, materialId: id })))
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
    await db.delete(personMaterials).where(eq(personMaterials.materialId, id))
    await db.delete(materials).where(eq(materials.id, id))
    await logAdminAction("delete", "material", id, current?.title ?? null)

    redirect(`/admin${flashParam("Материал удалён")}`)
}
