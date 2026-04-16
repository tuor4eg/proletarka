import { notFound } from "next/navigation"
import { eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import {
    materials,
    entities,
    people,
    artifacts,
    materialTopics,
    artifactMaterials,
    personMaterials,
    materialSources,
    sources,
} from "@/db/schema"
import { updateMaterial, deleteMaterial } from "../actions"
import { MaterialForm } from "@/components/MaterialForm"
import { EditPageHeader } from "@/components/EditPageHeader"
import { getBackHref, parseBackstack } from "@/lib/adminBackstack"
import { fetchTopicTree } from "@/db/queries"

type Props = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ backstack?: string }>
}

export default async function EditMaterialPage({ params, searchParams }: Props) {
    const { id } = await params
    const { backstack } = await searchParams
    const numericId = Number(id)
    const currentBackstack = parseBackstack(backstack)
    const backHref = getBackHref(currentBackstack, "/admin/materials")

    if (!Number.isInteger(numericId) || numericId <= 0) {
        notFound()
    }

    const [
        [material],
        entityRows,
        topicRows,
        selectedRows,
        linkedArtifactRows,
        selectedPersonRows,
        materialSourceRows,
    ] = await Promise.all([
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
        fetchTopicTree(),
        db
            .select({ topicId: materialTopics.topicId })
            .from(materialTopics)
            .where(eq(materialTopics.materialId, numericId)),
        db
            .select({ title: artifacts.title })
            .from(artifactMaterials)
            .innerJoin(artifacts, eq(artifactMaterials.artifactId, artifacts.id))
            .where(eq(artifactMaterials.materialId, numericId)),
        db
            .select({ personId: personMaterials.personId })
            .from(personMaterials)
            .where(eq(personMaterials.materialId, numericId)),
        db
            .select({
                label: sources.label,
                url: sources.url,
            })
            .from(materialSources)
            .innerJoin(sources, eq(materialSources.sourceId, sources.id))
            .where(eq(materialSources.materialId, numericId)),
    ])

    if (!material) {
        notFound()
    }

    const entitiesList = entityRows.map((r) => ({
        id: r.id,
        type: r.type,
        displayName: r.personName ?? r.artifactTitle ?? r.id.toString(),
    }))

    const selectedTopicIds = selectedRows.map((r) => r.topicId)
    const selectedPersonIds = selectedPersonRows.map((r) => r.personId)
    const selectedPeople = selectedPersonIds.length
        ? await db
              .select({ id: people.id, name: people.name })
              .from(people)
              .where(inArray(people.id, selectedPersonIds))
        : []
    const action = updateMaterial.bind(null, numericId)
    const deleteAction = deleteMaterial.bind(null, numericId)

    const deleteConfirmBody =
        linkedArtifactRows.length > 0
            ? `Этот материал используется в ${linkedArtifactRows.length > 1 ? "объектах" : "объекте"}: ${linkedArtifactRows.map((r) => r.title).join(", ")}. После удаления он исчезнет и оттуда. Это действие нельзя отменить.`
            : "Это действие нельзя отменить."

    return (
        <div className="py-6">
            <EditPageHeader
                backHref={backHref}
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
                people={selectedPeople}
                selectedTopicIds={selectedTopicIds}
                selectedPersonIds={selectedPersonIds}
                initialSources={materialSourceRows}
                materialTypeLocked={
                    material.materialType === "news" || material.materialType === "group_photo"
                }
                defaultSectionId={material.sectionId ?? undefined}
            />
        </div>
    )
}
