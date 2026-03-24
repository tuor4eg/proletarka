import { eq } from "drizzle-orm"
import { db } from "@/db"
import { entities, people, topics, type MaterialType } from "@/db/schema"
import { createMaterial } from "../actions"
import { MaterialForm } from "@/components/MaterialForm"

type Props = {
    searchParams: Promise<{ entityId?: string; materialType?: MaterialType }>
}

export default async function NewMaterialPage({ searchParams }: Props) {
    const { entityId, materialType } = await searchParams

    const [entityRows, topicRows] = await Promise.all([
        db
            .select({ id: entities.id, type: entities.type, personName: people.name })
            .from(entities)
            .leftJoin(people, eq(entities.personId, people.id)),
        db.select({ id: topics.id, title: topics.title }).from(topics),
    ])

    const entitiesList = entityRows.map((r) => ({
        id: r.id,
        type: r.type,
        displayName: r.personName ?? r.id.toString(),
    }))

    return (
        <div className="py-6">
            <h1 className="text-xl font-bold mb-6">Новый материал</h1>
            <MaterialForm
                action={createMaterial}
                entities={entitiesList}
                topics={topicRows}
                defaultEntityId={entityId ? Number(entityId) : undefined}
                defaultMaterialType={materialType}
            />
        </div>
    )
}
