import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { eq, desc, and, inArray } from "drizzle-orm"
import { db } from "@/db"
import { entities, people, materials, personMaterials, personSources, sources } from "@/db/schema"
import {
    updatePerson,
    deletePerson,
    getEventsByEntityId,
    linkGroupPhotoToPerson,
    unlinkGroupPhotoFromPerson,
} from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { ImageUpload } from "@/components/ImageUpload"
import { DeleteButton } from "@/components/DeleteButton"
import { SubmitButton } from "@/components/SubmitButton"
import { EditPageHeader } from "@/components/EditPageHeader"
import { EventsBlock } from "@/components/EventsBlock"
import { LinkedMaterialsList, TYPE_LABEL, STATUS_LABEL } from "@/components/LinkedMaterialsList"
import { CodeField } from "@/components/CodeField"
import { GroupPhotoLinkSearch } from "@/components/GroupPhotoLinkSearch"
import { SourcesInput } from "@/components/SourcesInput"
import { EditPersonFormTabs } from "@/components/EditPersonFormTabs"
import {
    buildBackstackHref,
    getBackHref,
    parseBackstack,
    pushBackstack,
    serializeBackstack,
} from "@/lib/adminBackstack"
import { fetchTopicTree } from "@/db/queries"

type Props = {
    params: Promise<{ code: string }>
    searchParams: Promise<{ backstack?: string }>
}

export default async function EditPersonPage({ params, searchParams }: Props) {
    const { code } = await params
    const { backstack } = await searchParams
    const currentBackstack = parseBackstack(backstack)
    const backHref = getBackHref(currentBackstack, "/admin/people")
    const personUrl = buildBackstackHref(`/admin/people/${code}`, currentBackstack)
    const nextBackstack = pushBackstack(currentBackstack, personUrl)
    const materialBackstack = serializeBackstack(nextBackstack)

    const [row] = await db
        .select({ entity: entities, person: people })
        .from(entities)
        .leftJoin(people, eq(entities.personId, people.id))
        .where(eq(people.code, code))
        .limit(1)

    if (!row) notFound()

    if (row.entity.type === "artifact") {
        redirect(`/admin/artifacts/${row.entity.code}`)
    }

    if (!row.person) notFound()

    const { entity, person } = row

    const [linkedMaterials, groupPhotos, allTopics, entityEvents, sourceRows] = await Promise.all([
        db
            .select({
                id: materials.id,
                title: materials.title,
                materialType: materials.materialType,
                status: materials.status,
                position: materials.position,
            })
            .from(materials)
            .where(eq(materials.entityId, entity.id))
            .orderBy(desc(materials.createdAt)),
        db
            .select({
                id: materials.id,
                title: materials.title,
                materialType: materials.materialType,
                status: materials.status,
            })
            .from(personMaterials)
            .innerJoin(materials, eq(personMaterials.materialId, materials.id))
            .where(
                and(
                    eq(personMaterials.personId, person.id),
                    eq(materials.materialType, "group_photo"),
                ),
            )
            .orderBy(desc(materials.createdAt)),
        fetchTopicTree(),
        getEventsByEntityId(entity.id),
        db
            .select({
                label: sources.label,
                url: sources.url,
            })
            .from(personSources)
            .innerJoin(sources, eq(personSources.sourceId, sources.id))
            .where(eq(personSources.personId, person.id)),
    ])

    const updateAction = updatePerson.bind(null, person.id)
    const deleteAction = deletePerson.bind(null, entity.id, person.id)
    const linkGroupPhotoAction = linkGroupPhotoToPerson.bind(null, person.id, person.code)
    const groupPhotoIds = groupPhotos.map((photo) => photo.id)
    const participantRows = groupPhotoIds.length
        ? await db
              .select({
                  materialId: personMaterials.materialId,
                  personId: personMaterials.personId,
              })
              .from(personMaterials)
              .where(inArray(personMaterials.materialId, groupPhotoIds))
        : []

    const participantCountByMaterialId = new Map<number, number>()
    for (const row of participantRows) {
        participantCountByMaterialId.set(
            row.materialId,
            (participantCountByMaterialId.get(row.materialId) ?? 0) + 1,
        )
    }

    const blockingGroupPhotos = groupPhotos.filter(
        (photo) => (participantCountByMaterialId.get(photo.id) ?? 0) <= 2,
    )
    const removableGroupPhotos = groupPhotos.filter(
        (photo) => (participantCountByMaterialId.get(photo.id) ?? 0) > 2,
    )
    const deleteDisabled = blockingGroupPhotos.length > 0

    return (
        <div className="py-6">
            <EditPageHeader backHref={backHref} publicUrl={`/people/${person.code}`} isPublished />
            <h1 className="text-xl font-bold mb-6">Редактировать человека</h1>
            <div className="mb-4">
                <CodeField code={person.code} />
            </div>
            <form action={updateAction} className="flex flex-col gap-4">
                <EditPersonFormTabs
                    main={
                        <>
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
                        </>
                    }
                    sources={
                        <Field label="Внешние источники">
                            <SourcesInput initialSources={sourceRows} />
                        </Field>
                    }
                    events={
                        <Field label="События">
                            <EventsBlock
                                entityId={entity.id}
                                initialEvents={entityEvents}
                                topics={allTopics}
                            />
                        </Field>
                    }
                />
                <div className="flex items-center gap-3 mt-0">
                    <SubmitButton label="Сохранить" />
                    <DeleteButton
                        action={deleteAction}
                        hideConfirmButton={deleteDisabled}
                        confirmBody={
                            <div className="space-y-3">
                                <p>
                                    {linkedMaterials.length > 0
                                        ? `Будут удалены все связанные материалы (${linkedMaterials.length} шт.).`
                                        : "Это действие нельзя отменить."}
                                </p>
                                {removableGroupPhotos.length > 0 && (
                                    <div>
                                        <p className="font-medium text-gray-700 mb-1">
                                            Человек будет удален из групповых фото:
                                        </p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {removableGroupPhotos.map((photo) => (
                                                <li key={photo.id}>
                                                    <Link
                                                        href={`/admin/${photo.id}`}
                                                        className="underline underline-offset-2 hover:text-gray-700"
                                                    >
                                                        {photo.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {blockingGroupPhotos.length > 0 && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                                        <p className="font-medium mb-1">Удаление пока запрещено.</p>
                                        <p className="mb-2">
                                            В этих групповых фото сейчас только два человека.
                                            Сначала добавьте других людей или исправьте тип
                                            материала:
                                        </p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {blockingGroupPhotos.map((photo) => (
                                                <li key={photo.id}>
                                                    <Link
                                                        href={`/admin/${photo.id}`}
                                                        className="underline underline-offset-2 hover:text-red-800"
                                                    >
                                                        {photo.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        }
                    />
                </div>
            </form>

            <LinkedMaterialsList
                entityId={entity.id}
                materials={linkedMaterials}
                addHref={`/admin/new?entityId=${entity.id}`}
                itemBackstack={materialBackstack}
            />

            <div className="mt-10 mb-10">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold">Групповые фото</h2>
                    <Link
                        href={`/admin/new?materialType=group_photo&personId=${person.id}`}
                        className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
                    >
                        + Добавить групповое фото
                    </Link>
                </div>
                <GroupPhotoLinkSearch personId={person.id} action={linkGroupPhotoAction} />
                {groupPhotos.length === 0 ? (
                    <p className="text-sm text-gray-400">Групповых фото пока нет.</p>
                ) : (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                        {groupPhotos.map((m) => (
                            <div
                                key={m.id}
                                className="flex items-center gap-2 px-4 hover:bg-gray-50 transition-colors"
                            >
                                <Link
                                    href={buildBackstackHref(`/admin/${m.id}`, nextBackstack)}
                                    className="flex items-center gap-3 py-2.5 flex-1 min-w-0"
                                >
                                    <span className="text-sm font-medium flex-1 min-w-0 truncate">
                                        {m.title}
                                    </span>
                                    <span className="text-xs text-gray-400 shrink-0">
                                        {TYPE_LABEL[m.materialType]}
                                    </span>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                                            m.status === "published"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {STATUS_LABEL[m.status]}
                                    </span>
                                </Link>
                                <form
                                    action={unlinkGroupPhotoFromPerson.bind(
                                        null,
                                        person.id,
                                        person.code,
                                        m.id,
                                    )}
                                >
                                    <button
                                        type="submit"
                                        className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0"
                                    >
                                        Отвязать
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
