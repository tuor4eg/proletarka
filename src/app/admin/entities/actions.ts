"use server"

import { redirect } from "next/navigation"
import { eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import { entities, people, materials, materialTopics } from "@/db/schema"
import { generateCode } from "@/lib/generateCode"
import { deleteImage } from "@/lib/s3"
import { flashParam } from "@/lib/flash"
import {
    type EventInput,
    createEvents,
    parsePersonForm,
    getEventsByEntityId,
} from "@/app/admin/people/actions"

export { getEventsByEntityId }

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
