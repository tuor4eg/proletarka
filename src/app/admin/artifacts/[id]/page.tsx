import { notFound } from "next/navigation"
import { eq, asc, sql } from "drizzle-orm"
import { db } from "@/db"
import { entities, artifacts, materials } from "@/db/schema"
import { updateArtifact, deleteArtifact } from "../actions"
import { inputClass, Field } from "@/components/MaterialForm"
import { DeleteButton } from "@/components/DeleteButton"
import { SubmitButton } from "@/components/SubmitButton"
import { LinkedMaterialsList } from "@/components/LinkedMaterialsList"
import { CodeField } from "@/components/CodeField"

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

    const linkedMaterials = await db
        .select({
            id: materials.id,
            title: materials.title,
            materialType: materials.materialType,
            status: materials.status,
            position: materials.position,
        })
        .from(materials)
        .where(eq(materials.entityId, numericId))
        .orderBy(sql`${materials.position} ASC NULLS LAST`, asc(materials.id))

    const { artifact, entity } = row
    const updateAction = updateArtifact.bind(null, artifact.id)
    const deleteAction = deleteArtifact.bind(null, entity.id)

    return (
        <div className="py-6">
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
                addHref={`/admin/new?entityId=${numericId}&materialType=photo`}
                showPosition
            />
        </div>
    )
}
