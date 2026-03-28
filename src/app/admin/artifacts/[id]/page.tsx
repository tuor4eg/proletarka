import { notFound } from "next/navigation"
import { eq, asc, sql } from "drizzle-orm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { db } from "@/db"
import { entities, artifacts, materials, topics, entityTopics, artifactSections } from "@/db/schema"
import { updateArtifact, deleteArtifact, createSection, updateSection, deleteSection } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { DeleteButton } from "@/components/DeleteButton"
import { SubmitButton } from "@/components/SubmitButton"
import { LinkedMaterialsList } from "@/components/LinkedMaterialsList"
import { ImageUpload } from "@/components/ImageUpload"
import { CodeField } from "@/components/CodeField"
import { SortableMaterialsList } from "@/components/SortableMaterialsList"
import { PublishToggle } from "@/components/PublishToggle"

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditArtifactPage({ params }: Props) {
    const { id } = await params
    const numericId = Number(id)

    if (!Number.isInteger(numericId) || numericId <= 0) notFound()

    const [row] = await db
        .select({ entity: entities, artifact: artifacts })
        .from(entities)
        .innerJoin(artifacts, eq(entities.artifactId, artifacts.id))
        .where(eq(entities.id, numericId))
        .limit(1)

    if (!row) notFound()

    const [allTopics, selectedTopicRows] = await Promise.all([
        db.select({ id: topics.id, title: topics.title }).from(topics),
        db
            .select({ topicId: entityTopics.topicId })
            .from(entityTopics)
            .where(eq(entityTopics.entityId, numericId)),
    ])

    const selectedTopicIds = selectedTopicRows.map((r) => r.topicId)

    const linkedMaterials = await db
        .select({
            id: materials.id,
            title: materials.title,
            materialType: materials.materialType,
            status: materials.status,
            position: materials.position,
            sectionId: materials.sectionId,
        })
        .from(materials)
        .where(eq(materials.entityId, numericId))
        .orderBy(sql`${materials.position} ASC NULLS LAST`, asc(materials.id))

    const sections = await db
        .select()
        .from(artifactSections)
        .where(eq(artifactSections.artifactId, row.artifact.id))
        .orderBy(asc(artifactSections.position))

    const { artifact, entity } = row
    const updateAction = updateArtifact.bind(null, artifact.id)
    const deleteAction = deleteArtifact.bind(null, entity.id)
    const createSectionAction = createSection.bind(null, artifact.id)
    const isStand = artifact.artifactType === "stand"

    return (
        <div className="py-6">
            <div className="mb-6">
                <Link
                    href="/admin/artifacts"
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors w-fit"
                >
                    <ArrowLeft size={15} />
                    Назад
                </Link>
            </div>
            <h1 className="text-xl font-bold mb-6">Исторический объект</h1>
            <div className="mb-4">
                <CodeField code={artifact.code} />
            </div>
            <form action={updateAction} className="flex flex-col gap-4">
                <Field label="Название *">
                    <input
                        name="title"
                        type="text"
                        required
                        defaultValue={artifact.title}
                        className={inputClass}
                    />
                </Field>
                <Field label="Описание">
                    <textarea
                        name="description"
                        rows={4}
                        defaultValue={artifact.description ?? ""}
                        className={inputClass}
                    />
                </Field>
                <Field label="Период" hint="Например: «1941–1945» или «ок. 1943»">
                    <input
                        name="yearsLabel"
                        type="text"
                        defaultValue={artifact.yearsLabel ?? ""}
                        className={inputClass}
                    />
                </Field>
                {allTopics.length > 0 && (
                    <Field label="Темы">
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5">
                            {allTopics.map((topic) => (
                                <label
                                    key={topic.id}
                                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        name="topicIds"
                                        value={topic.id}
                                        defaultChecked={selectedTopicIds.includes(topic.id)}
                                        className="rounded"
                                    />
                                    {topic.title}
                                </label>
                            ))}
                        </div>
                    </Field>
                )}
                <Field label="Тип">
                    <select name="artifactType" defaultValue={artifact.artifactType} className={inputClass}>
                        <option value="general">Обычный</option>
                        <option value="stand">Стенд</option>
                    </select>
                </Field>
                <ImageUpload
                    fileInputName="coverImageFile"
                    urlInputName="coverImagePath"
                    label="Обложка"
                    defaultUrl={artifact.coverImagePath ?? undefined}
                />
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

            {isStand ? (
                <div className="mt-10 flex flex-col gap-8">
                    {sections.map((section) => {
                        const sectionMaterials = linkedMaterials.filter(m => m.sectionId === section.id)
                        const updateSectionAction = updateSection.bind(null, section.id)
                        const deleteSectionAction = deleteSection.bind(null, section.id)
                        return (
                            <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                                    <form action={updateSectionAction} className="flex-1 flex items-center gap-2">
                                        <input
                                            name="title"
                                            defaultValue={section.title}
                                            className="text-sm font-semibold bg-transparent border-none outline-none flex-1 focus:bg-white focus:border focus:border-gray-300 focus:rounded px-1"
                                        />
                                        <button type="submit" className="text-xs text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                                            Сохранить
                                        </button>
                                    </form>
                                    <form action={deleteSectionAction}>
                                        <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0">
                                            Удалить раздел
                                        </button>
                                    </form>
                                </div>
                                {sectionMaterials.length > 0 && (
                                    <SortableMaterialsList initialItems={sectionMaterials} />
                                )}
                                <div className="px-4 py-3 border-t border-gray-100">
                                    <Link
                                        href={`/admin/new?entityId=${numericId}&sectionId=${section.id}&materialType=photo`}
                                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                                    >
                                        + Добавить материал
                                    </Link>
                                </div>
                            </div>
                        )
                    })}

                    {(() => {
                        const unsectioned = linkedMaterials.filter(m => !m.sectionId)
                        return unsectioned.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Без раздела</p>
                                <SortableMaterialsList initialItems={unsectioned} />
                            </div>
                        )
                    })()}

                    <div className="border border-dashed border-gray-300 rounded-xl p-4">
                        <p className="text-sm font-medium mb-3">Новый раздел</p>
                        <form action={createSectionAction} className="flex gap-2">
                            <input
                                name="title"
                                placeholder="Название раздела"
                                className={inputClass + " flex-1"}
                                required
                            />
                            <button
                                type="submit"
                                className="text-sm bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-800 transition-colors shrink-0"
                            >
                                Добавить
                            </button>
                        </form>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <Link
                            href={`/admin/new?entityId=${numericId}&materialType=photo`}
                            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            + Добавить материал без раздела
                        </Link>
                    </div>
                </div>
            ) : (
                <LinkedMaterialsList
                    entityId={numericId}
                    materials={linkedMaterials}
                    addHref={`/admin/new?entityId=${numericId}&materialType=photo`}
                    showPosition
                />
            )}
        </div>
    )
}
