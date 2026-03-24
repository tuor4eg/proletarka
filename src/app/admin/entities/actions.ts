"use server"

import { redirect } from "next/navigation"
import { eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { entities, people, materials, materialTopics, events, eventTopics } from "@/db/schema"
import { generateCode } from "@/lib/generateCode"
import { resolveImageUpload, deleteImage } from "@/lib/s3"
import { flashParam } from "@/lib/flash"

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

    // Группируем темы по событию
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

            if (input.topicIds.length > 0) {
                await tx
                    .insert(eventTopics)
                    .values(input.topicIds.map((topicId) => ({ eventId: event.id, topicId })))
            }
        }
    })
}

export async function deleteEvent(eventId: number) {
    await db.delete(events).where(eq(events.id, eventId))
}

async function parsePersonForm(formData: FormData) {
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

export async function createEntity(formData: FormData) {
    const personValues = await parsePersonForm(formData)
    const code = generateCode(personValues.name)

    const [person] = await db
        .insert(people)
        .values({ ...personValues, code })
        .returning({ id: people.id })

    const [entity] = await db
        .insert(entities)
        .values({ type: "person", personId: person.id, code })
        .returning({ id: entities.id })

    redirect(`/admin/entities/${entity.id}${flashParam("Человек добавлен")}`)
}

export async function updateEntity(personId: number, formData: FormData) {
    const [current] = await db
        .select({ mainPhotoPath: people.mainPhotoPath })
        .from(people)
        .where(eq(people.id, personId))
        .limit(1)

    const personValues = await parsePersonForm(formData)

    if (current?.mainPhotoPath && current.mainPhotoPath !== personValues.mainPhotoPath) {
        await deleteImage(current.mainPhotoPath)
    }

    const [[entity]] = await Promise.all([
        db
            .select({ id: entities.id })
            .from(entities)
            .where(eq(entities.personId, personId))
            .limit(1),
        db
            .update(people)
            .set({ ...personValues, updatedAt: new Date() })
            .where(eq(people.id, personId)),
    ])

    if (!entity?.id) redirect("/admin/entities")

    const newEventsRaw = formData.get("newEvents") as string
    if (newEventsRaw) {
        const newEvents: EventInput[] = JSON.parse(newEventsRaw)
        await createEvents(entity.id, newEvents)
    }

    redirect(`/admin/entities/${entity.id}${flashParam("Сохранено")}`)
}

export async function deleteEntity(entityId: number, personId: number) {
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
    redirect(`/admin/entities${flashParam("Запись удалена")}`)
}
