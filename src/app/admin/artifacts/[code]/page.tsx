import { notFound } from "next/navigation"
import { eq, asc, sql, and } from "drizzle-orm"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { db } from "@/db"
import { entities, artifacts, materials, topics, entityTopics, artifactSections, artifactMaterials, people } from "@/db/schema"
import { updateArtifact, deleteArtifact, createSection, updateSection, deleteSection, shiftSection, unlinkMaterial } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { DeleteButton } from "@/components/DeleteButton"
import { SubmitButton } from "@/components/SubmitButton"
import { LinkedMaterialsList } from "@/components/LinkedMaterialsList"
import { LinkedArtifactMaterialsBlock } from "@/components/LinkedArtifactMaterialsBlock"
import { ImageUpload } from "@/components/ImageUpload"
import { CodeField } from "@/components/CodeField"
import { SortableMaterialsList } from "@/components/SortableMaterialsList"
import { PublishToggle } from "@/components/PublishToggle"

type Props = {
    params: Promise<{ code: string }>
}

export default async function EditArtifactPage({ params }: Props) {
    const { code } = await params

    const [row] = await db
        .select({ entity: entities, artifact: artifacts })
        .from(entities)
        .innerJoin(artifacts, eq(entities.artifactId, artifacts.id))
        .where(eq(artifacts.code, code))
        .limit(1)

    if (!row) notFound()

    const [allTopics, selectedTopicRows] = await Promise.all([
        db.select({ id: topics.id, title: topics.title }).from(topics),
        db
            .select({ topicId: entityTopics.topicId })
            .from(entityTopics)
            .where(eq(entityTopics.entityId, row.entity.id)),
    ])

    const selectedTopicIds = selectedTopicRows.map((r) => r.topicId)

    const [linkedMaterials, sections, linkedArtifactMaterials] = await Promise.all([
        db
            .select({
                id: materials.id,
                title: materials.title,
                materialType: materials.materialType,
                status: materials.status,
                position: materials.position,
                sectionId: materials.sectionId,
            })
            .from(materials)
            .where(eq(materials.entityId, row.entity.id))
            .orderBy(sql`${materials.position} ASC NULLS LAST`, asc(materials.id)),
        db
            .select()
            .from(artifactSections)
            .where(eq(artifactSections.artifactId, row.artifact.id))
            .orderBy(asc(artifactSections.position)),
        db
            .select({
                materialId: artifactMaterials.materialId,
                title: materials.title,
                materialType: materials.materialType,
                status: materials.status,
                sectionId: artifactMaterials.sectionId,
                position: artifactMaterials.position,
                personName: people.name,
                personCode: people.code,
            })
            .from(artifactMaterials)
            .innerJoin(materials, eq(artifactMaterials.materialId, materials.id))
            .leftJoin(entities, eq(materials.entityId, entities.id))
            .leftJoin(people, eq(entities.personId, people.id))
            .where(eq(artifactMaterials.artifactId, row.artifact.id))
            .orderBy(asc(materials.title)),
    ])

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
                <div className="flex gap-3">
                    <Field label="Год от">
                        <input
                            name="yearFrom"
                            type="number"
                            min="1800"
                            max="2100"
                            defaultValue={artifact.yearFrom ?? ""}
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Год до">
                        <input
                            name="yearTo"
                            type="number"
                            min="1800"
                            max="2100"
                            defaultValue={artifact.yearTo ?? ""}
                            className={inputClass}
                        />
                    </Field>
                </div>
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
                        <option value="rarity">Экспонат</option>
                        <option value="fund">Фонд</option>
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
                    {sections.map((section, i) => {
                        const sectionMaterials = linkedMaterials.filter(m => m.sectionId === section.id)
                        const sectionLinkedMaterials = linkedArtifactMaterials.filter(m => m.sectionId === section.id)
                        const updateSectionAction = updateSection.bind(null, section.id)
                        const deleteSectionAction = deleteSection.bind(null, section.id)
                        const shiftUpAction = shiftSection.bind(null, section.id, "up")
                        const shiftDownAction = shiftSection.bind(null, section.id, "down")
                        return (
                            <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 flex items-start gap-3 border-b border-gray-200">
                                    <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                                        <form action={shiftUpAction}>
                                            <button type="submit" disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors leading-none text-xs">▲</button>
                                        </form>
                                        <form action={shiftDownAction}>
                                            <button type="submit" disabled={i === sections.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors leading-none text-xs">▼</button>
                                        </form>
                                    </div>
                                    <form id={`update-section-${section.id}`} action={updateSectionAction} className="hidden" />
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                name="title"
                                                form={`update-section-${section.id}`}
                                                defaultValue={section.title}
                                                className="text-sm font-semibold flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 focus:outline-none focus:border-gray-400"
                                            />
                                            <button type="submit" form={`update-section-${section.id}`} className="text-xs text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                                                Сохранить
                                            </button>
                                            <form action={deleteSectionAction}>
                                                <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0">
                                                    Удалить раздел
                                                </button>
                                            </form>
                                        </div>
                                        <textarea
                                            name="description"
                                            form={`update-section-${section.id}`}
                                            defaultValue={section.description ?? ""}
                                            rows={2}
                                            placeholder="Описание раздела (необязательно)"
                                            className="text-xs text-gray-500 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 resize-none focus:outline-none focus:border-gray-400 placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>
                                {(sectionMaterials.length > 0 || sectionLinkedMaterials.length > 0) && (
                                    <SortableMaterialsList
                                        initialItems={sectionMaterials}
                                        sections={sections}
                                        artifactId={row.artifact.id}
                                        linkedItems={sectionLinkedMaterials.map((m) => ({
                                            id: m.materialId,
                                            title: m.title,
                                            materialType: m.materialType,
                                            status: m.status,
                                            position: m.position,
                                            sectionId: m.sectionId,
                                            personName: m.personName,
                                            unlinkAction: unlinkMaterial.bind(null, row.artifact.id, m.materialId),
                                        }))}
                                    />
                                )}
                                <div className="px-4 py-3 border-t border-gray-100">
                                    <Link
                                        href={`/admin/new?entityId=${row.entity.id}&sectionId=${section.id}&materialType=photo`}
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
                                <SortableMaterialsList initialItems={unsectioned} sections={sections} />
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
                            href={`/admin/new?entityId=${row.entity.id}&materialType=photo`}
                            className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            + Добавить материал без раздела
                        </Link>
                    </div>
                </div>
            ) : (
                <LinkedMaterialsList
                    entityId={row.entity.id}
                    materials={linkedMaterials}
                    addHref={`/admin/new?entityId=${row.entity.id}&materialType=photo`}
                    showPosition
                />
            )}

            <LinkedArtifactMaterialsBlock
                artifactId={row.artifact.id}
                linkedMaterials={isStand ? linkedArtifactMaterials.filter(m => !m.sectionId) : linkedArtifactMaterials}
                sections={sections}
                isStand={isStand}
            />
        </div>
    )
}
