import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import {
    materials,
    entities,
    people,
    artifacts,
    topics,
    materialTopics,
    artifactMaterials,
} from "@/db/schema"
import { updateMaterial, deleteMaterial } from "../actions"
import { MaterialForm } from "@/components/MaterialForm"
import { EditPageHeader } from "@/components/EditPageHeader"

type Props = {
    params: Promise<{ id: string }>
}

export default async function EditMaterialPage({ params }: Props) {
    const { id } = await params
    const numericId = Number(id)

    if (!Number.isInteger(numericId) || numericId <= 0) {
        notFound()
    }

    const [[material], entityRows, topicRows, selectedRows, linkedArtifactRows] = await Promise.all(
        [
            db.select().from(materials).where(eq(materials.id, numericId)).limit(1),
            db
                .select({
                    id: entities.id,
                    type: entities.type,
                    personName: people.name,
                    artifactTitle: artifacts.title,
                })
                .from(entities)
                .leftJoin(people, eq(entities.personId, people.id))
                .leftJoin(artifacts, eq(entities.artifactId, artifacts.id)),
            db.select({ id: topics.id, title: topics.title }).from(topics),
            db
                .select({ topicId: materialTopics.topicId })
                .from(materialTopics)
                .where(eq(materialTopics.materialId, numericId)),
            db
                .select({ title: artifacts.title })
                .from(artifactMaterials)
                .innerJoin(artifacts, eq(artifactMaterials.artifactId, artifacts.id))
                .where(eq(artifactMaterials.materialId, numericId)),
        ],
    )

    if (!material) {
        notFound()
    }

    const entitiesList = entityRows.map((r) => ({
        id: r.id,
        type: r.type,
        displayName: r.personName ?? r.artifactTitle ?? r.id.toString(),
    }))

    const selectedTopicIds = selectedRows.map((r) => r.topicId)
    const action = updateMaterial.bind(null, numericId)
    const deleteAction = deleteMaterial.bind(null, numericId)

    const deleteConfirmBody =
        linkedArtifactRows.length > 0
            ? `Этот материал используется в ${linkedArtifactRows.length > 1 ? "объектах" : "объекте"}: ${linkedArtifactRows.map((r) => r.title).join(", ")}. После удаления он исчезнет и оттуда. Это действие нельзя отменить.`
            : "Это действие нельзя отменить."

    return (
        <div className="py-6">
            <EditPageHeader
                publicUrl={`/materials/${numericId}`}
                isPublished={material.status === "published"}
            />
            <MaterialForm
                action={action}
                deleteAction={deleteAction}
                deleteConfirmBody={deleteConfirmBody}
                material={material}
                entities={entitiesList}
                topics={topicRows}
                selectedTopicIds={selectedTopicIds}
                materialTypeLocked={material.materialType === "news"}
                defaultSectionId={material.sectionId ?? undefined}
            />
        </div>
    )
}
