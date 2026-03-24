import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { materials, entities, people, topics, materialTopics } from "@/db/schema"
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

    const [[material], entityRows, topicRows, selectedRows] = await Promise.all([
        db.select().from(materials).where(eq(materials.id, numericId)).limit(1),
        db
            .select({ id: entities.id, type: entities.type, personName: people.name })
            .from(entities)
            .leftJoin(people, eq(entities.personId, people.id)),
        db.select({ id: topics.id, title: topics.title }).from(topics),
        db
            .select({ topicId: materialTopics.topicId })
            .from(materialTopics)
            .where(eq(materialTopics.materialId, numericId)),
    ])

    if (!material) {
        notFound()
    }

    const entitiesList = entityRows.map((r) => ({
        id: r.id,
        type: r.type,
        displayName: r.personName ?? r.id.toString(),
    }))

    const selectedTopicIds = selectedRows.map((r) => r.topicId)
    const action = updateMaterial.bind(null, numericId)
    const deleteAction = deleteMaterial.bind(null, numericId)

    return (
        <div className="py-6">
            <EditPageHeader
                publicUrl={`/materials/${numericId}`}
                isPublished={material.status === "published"}
            />
            <MaterialForm
                action={action}
                deleteAction={deleteAction}
                material={material}
                entities={entitiesList}
                topics={topicRows}
                selectedTopicIds={selectedTopicIds}
            />
        </div>
    )
}
