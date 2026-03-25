import { notFound, redirect } from "next/navigation"
import { eq, desc } from "drizzle-orm"
import { db } from "@/db"
import { entities, people, materials, topics } from "@/db/schema"
import { updatePerson, deletePerson, getEventsByEntityId } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { ImageUpload } from "@/components/ImageUpload"
import { DeleteButton } from "@/components/DeleteButton"
import { SubmitButton } from "@/components/SubmitButton"
import { EditPageHeader } from "@/components/EditPageHeader"
import { EventsBlock } from "@/components/EventsBlock"
import { LinkedMaterialsList } from "@/components/LinkedMaterialsList"
import { CodeField } from "@/components/CodeField"

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditPersonPage({ params }: Props) {
    const { id } = await params
    const numericId = Number(id)

    if (!Number.isInteger(numericId) || numericId <= 0) notFound()

    const [row] = await db
        .select({ entity: entities, person: people })
        .from(entities)
        .leftJoin(people, eq(entities.personId, people.id))
        .where(eq(entities.id, numericId))
        .limit(1)

    if (!row) notFound()

    if (row.entity.type === "artifact") {
        redirect(`/admin/artifacts/${numericId}`)
    }

    if (!row.person) notFound()

    const [linkedMaterials, allTopics, entityEvents] = await Promise.all([
        db
            .select({
                id: materials.id,
                title: materials.title,
                materialType: materials.materialType,
                status: materials.status,
                position: materials.position,
            })
            .from(materials)
            .where(eq(materials.entityId, numericId))
            .orderBy(desc(materials.createdAt)),
        db.select({ id: topics.id, title: topics.title }).from(topics).orderBy(topics.title),
        getEventsByEntityId(numericId),
    ])

    const { entity, person } = row
    const updateAction = updatePerson.bind(null, person.id)
    const deleteAction = deletePerson.bind(null, entity.id, person.id)

    return (
        <div className="py-6">
            <EditPageHeader publicUrl={`/people/${numericId}`} isPublished />
            <h1 className="text-xl font-bold mb-6">Редактировать человека</h1>
            <div className="mb-4">
                <CodeField code={person.code} />
            </div>
            <form action={updateAction} className="flex flex-col gap-4">
                <Field label="Имя *">
                    <input
                        name="name"
                        type="text"
                        required
                        defaultValue={person.name}
                        className={inputClass}
                    />
                </Field>
                <Field label="Краткая биография">
                    <textarea
                        name="shortBio"
                        rows={3}
                        defaultValue={person.shortBio ?? ""}
                        className={inputClass}
                    />
                </Field>
                <div className="flex gap-4">
                    <Field label="Год рождения">
                        <input
                            name="birthYear"
                            type="number"
                            min={1800}
                            max={2100}
                            defaultValue={person.birthYear ?? ""}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Год смерти">
                        <input
                            name="deathYear"
                            type="number"
                            min={1800}
                            max={2100}
                            defaultValue={person.deathYear ?? ""}
                            className={inputClass}
                        />
                    </Field>
                </div>
                <Field
                    label="Годы жизни (если точные неизвестны)"
                    hint="Например: «не позднее 1917» или «ок. 1890–1943»"
                >
                    <input
                        name="yearsLabel"
                        type="text"
                        defaultValue={person.yearsLabel ?? ""}
                        className={inputClass}
                    />
                </Field>
                <ImageUpload
                    fileInputName="mainPhotoFile"
                    urlInputName="mainPhotoPath"
                    defaultUrl={person.mainPhotoPath ?? undefined}
                    label="Обложка"
                />
                <Field label="События">
                    <EventsBlock
                        entityId={numericId}
                        initialEvents={entityEvents}
                        topics={allTopics}
                    />
                </Field>
                <div className="flex items-center gap-3 mt-0">
                    <SubmitButton label="Сохранить" />
                    <DeleteButton
                        action={deleteAction}
                        confirmBody={
                            linkedMaterials.length > 0
                                ? `Будут удалены все связанные материалы (${linkedMaterials.length} шт.). Это действие нельзя отменить.`
                                : "Это действие нельзя отменить."
                        }
                    />
                </div>
            </form>

            <LinkedMaterialsList
                entityId={numericId}
                materials={linkedMaterials}
                addHref={`/admin/new?entityId=${numericId}`}
            />
        </div>
    )
}
