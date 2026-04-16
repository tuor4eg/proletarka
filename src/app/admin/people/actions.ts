"use server"

import { redirect } from "next/navigation"
import { eq, inArray, and } from "drizzle-orm"
import { db } from "@/db"
import {
    entities,
    people,
    materials,
    materialTopics,
    personMaterials,
    events,
    eventTopics,
} from "@/db/schema"
import { generateCode, CODE_PATTERN } from "@/lib/generateCode"
import { resolveImageUpload, deleteImage } from "@/lib/s3"
import { flashParam } from "@/lib/flash"
import { logAdminAction } from "@/lib/logAdminAction"
import { parseSourcesForm, replacePersonSources } from "@/lib/adminSources"
import { validateTopicSelection } from "@/lib/topicValidation"

export type EventInput = {
    text: string
    yearFrom: number | null
    yearTo: number | null
    yearsLabel: string | null
    topicIds: number[]
}

export async function getEventsByEntityId(entityId: number) {
    const rows = await db
        .select({
            id: events.id,
            text: events.text,
            yearFrom: events.yearFrom,
            yearTo: events.yearTo,
            yearsLabel: events.yearsLabel,
            topicId: eventTopics.topicId,
        })
        .from(events)
        .leftJoin(eventTopics, eq(eventTopics.eventId, events.id))
        .where(eq(events.entityId, entityId))
        .orderBy(events.yearFrom, events.id)

    const map = new Map<
        number,
        {
            id: number
            text: string
            yearFrom: number | null
            yearTo: number | null
            yearsLabel: string | null
            topicIds: number[]
        }
    >()
    for (const row of rows) {
        if (!map.has(row.id)) {
            map.set(row.id, {
                id: row.id,
                text: row.text,
                yearFrom: row.yearFrom,
                yearTo: row.yearTo,
                yearsLabel: row.yearsLabel,
                topicIds: [],
            })
        }
        if (row.topicId !== null) {
            map.get(row.id)!.topicIds.push(row.topicId)
        }
    }
    return Array.from(map.values())
}

export async function createEvents(entityId: number, inputs: EventInput[]) {
    if (inputs.length === 0) return

    await db.transaction(async (tx) => {
        for (const input of inputs) {
            const topicValidation = await validateTopicSelection(input.topicIds)

            if (!topicValidation.ok) {
                throw new Error(topicValidation.message)
            }

            const code = generateCode(input.text)
            const [event] = await tx
                .insert(events)
                .values({
                    code,
                    entityId,
                    text: input.text,
                    yearFrom: input.yearFrom,
                    yearTo: input.yearTo,
                    yearsLabel: input.yearsLabel,
                })
                .returning({ id: events.id })

            if (topicValidation.topicIds.length > 0) {
                await tx
                    .insert(eventTopics)
                    .values(
                        topicValidation.topicIds.map((topicId) => ({ eventId: event.id, topicId })),
                    )
            }
        }
    })
}

export async function deleteEvent(eventId: number) {
    await db.delete(events).where(eq(events.id, eventId))
}

export async function parsePersonForm(formData: FormData) {
    const birthYearRaw = formData.get("birthYear") as string
    const deathYearRaw = formData.get("deathYear") as string

    return {
        name: (formData.get("name") as string).trim(),
        shortBio: (formData.get("shortBio") as string) || null,
        birthYear: birthYearRaw ? Number(birthYearRaw) : null,
        deathYear: deathYearRaw ? Number(deathYearRaw) : null,
        yearsLabel: (formData.get("yearsLabel") as string) || null,
        mainPhotoPath: await resolveImageUpload(formData, "mainPhotoFile", "mainPhotoPath"),
    }
}

export async function createPerson(formData: FormData) {
    const personValues = await parsePersonForm(formData)
    const sourceItems = parseSourcesForm(formData)

    const customCodeRaw = (formData.get("customCode") as string)?.trim()
    let code: string

    if (customCodeRaw) {
        if (!CODE_PATTERN.test(customCodeRaw)) {
            redirect(`/admin/people/new${flashParam("Недопустимый формат code")}`)
        }
        const existing = await db
            .select({ id: people.id })
            .from(people)
            .where(eq(people.code, customCodeRaw))
            .limit(1)
        if (existing.length > 0) {
            redirect(`/admin/people/new${flashParam("Этот code уже занят")}`)
        }
        code = customCodeRaw
    } else {
        code = generateCode(personValues.name)
    }

    const [person] = await db
        .insert(people)
        .values({ ...personValues, code })
        .returning({ id: people.id })

    await db.insert(entities).values({ type: "person", personId: person.id, code })

    await replacePersonSources(person.id, sourceItems)

    await logAdminAction("create", "person", person.id, personValues.name)
    redirect(`/admin/people/${code}${flashParam("Человек добавлен")}`)
}

export async function updatePerson(personId: number, formData: FormData) {
    const [current] = await db
        .select({ mainPhotoPath: people.mainPhotoPath })
        .from(people)
        .where(eq(people.id, personId))
        .limit(1)

    const personValues = await parsePersonForm(formData)
    const sourceItems = parseSourcesForm(formData)

    if (current?.mainPhotoPath && current.mainPhotoPath !== personValues.mainPhotoPath) {
        await deleteImage(current.mainPhotoPath)
    }

    const [[entityRow], [updatedPerson]] = await Promise.all([
        db
            .select({ id: entities.id })
            .from(entities)
            .where(eq(entities.personId, personId))
            .limit(1),
        db
            .update(people)
            .set({ ...personValues, updatedAt: new Date() })
            .where(eq(people.id, personId))
            .returning({ code: people.code }),
    ])

    if (!entityRow?.id) redirect("/admin/people")

    await replacePersonSources(personId, sourceItems)

    const newEventsRaw = formData.get("newEvents") as string
    if (newEventsRaw) {
        const newEvents: EventInput[] = JSON.parse(newEventsRaw)
        await createEvents(entityRow.id, newEvents)
    }

    await logAdminAction("update", "person", personId, personValues.name)
    redirect(`/admin/people/${updatedPerson.code}${flashParam("Сохранено")}`)
}

export async function deletePerson(entityId: number, personId: number) {
    const [personToDelete] = await db
        .select({ name: people.name, code: people.code })
        .from(people)
        .where(eq(people.id, personId))
        .limit(1)

    const linkedGroupPhotoRows = await db
        .select({
            materialId: personMaterials.materialId,
            title: materials.title,
        })
        .from(personMaterials)
        .innerJoin(materials, eq(personMaterials.materialId, materials.id))
        .where(
            and(eq(personMaterials.personId, personId), eq(materials.materialType, "group_photo")),
        )

    const linkedGroupPhotoIds = linkedGroupPhotoRows.map((row) => row.materialId)
    const participantRows = linkedGroupPhotoIds.length
        ? await db
              .select({
                  materialId: personMaterials.materialId,
                  personId: personMaterials.personId,
              })
              .from(personMaterials)
              .where(inArray(personMaterials.materialId, linkedGroupPhotoIds))
        : []

    const participantCountByMaterialId = new Map<number, number>()
    for (const row of participantRows) {
        participantCountByMaterialId.set(
            row.materialId,
            (participantCountByMaterialId.get(row.materialId) ?? 0) + 1,
        )
    }

    const blockingGroupPhotos = linkedGroupPhotoRows.filter(
        (row) => (participantCountByMaterialId.get(row.materialId) ?? 0) <= 2,
    )

    if (blockingGroupPhotos.length > 0) {
        redirect(
            `/admin/people/${personToDelete?.code ?? personId}${flashParam("Нельзя удалить человека, пока не исправлены связанные групповые фото")}`,
        )
    }

    const linkedMaterials = await db
        .select({ id: materials.id, coverImagePath: materials.coverImagePath })
        .from(materials)
        .where(eq(materials.entityId, entityId))

    if (linkedMaterials.length > 0) {
        const materialIds = linkedMaterials.map((m) => m.id)
        await db.delete(materialTopics).where(inArray(materialTopics.materialId, materialIds))
        await db.delete(materials).where(inArray(materials.id, materialIds))

        const imagesToDelete = linkedMaterials
            .map((m) => m.coverImagePath)
            .filter(Boolean) as string[]
        await Promise.all(imagesToDelete.map((path) => deleteImage(path)))
    }

    await db.delete(entities).where(eq(entities.id, entityId))
    await db.delete(people).where(eq(people.id, personId))
    await logAdminAction("delete", "person", personId, personToDelete?.name ?? null)
    redirect(`/admin/people${flashParam("Запись удалена")}`)
}

export async function linkGroupPhotoToPerson(
    personId: number,
    personCode: string,
    formData: FormData,
) {
    const materialIdRaw = formData.get("materialId") as string
    const materialId = Number(materialIdRaw)

    if (!Number.isInteger(materialId) || materialId <= 0) {
        redirect(`/admin/people/${personCode}${flashParam("Не выбрано групповое фото")}`)
    }

    const [material] = await db
        .select({ id: materials.id, materialType: materials.materialType })
        .from(materials)
        .where(eq(materials.id, materialId))
        .limit(1)

    if (!material || material.materialType !== "group_photo") {
        redirect(
            `/admin/people/${personCode}${flashParam("Можно привязывать только групповое фото")}`,
        )
    }

    const existing = await db
        .select({ personId: personMaterials.personId })
        .from(personMaterials)
        .where(
            and(eq(personMaterials.personId, personId), eq(personMaterials.materialId, materialId)),
        )
        .limit(1)

    if (existing.length === 0) {
        await db.insert(personMaterials).values({ personId, materialId })
    }

    redirect(`/admin/people/${personCode}${flashParam("Групповое фото привязано")}`)
}

export async function unlinkGroupPhotoFromPerson(
    personId: number,
    personCode: string,
    materialId: number,
) {
    const linkedPeople = await db
        .select({ personId: personMaterials.personId })
        .from(personMaterials)
        .where(eq(personMaterials.materialId, materialId))

    if (linkedPeople.length <= 2) {
        redirect(
            `/admin/people/${personCode}${flashParam("У группового фото должно остаться минимум два человека")}`,
        )
    }

    await db
        .delete(personMaterials)
        .where(
            and(eq(personMaterials.personId, personId), eq(personMaterials.materialId, materialId)),
        )

    redirect(`/admin/people/${personCode}${flashParam("Групповое фото отвязано")}`)
}
