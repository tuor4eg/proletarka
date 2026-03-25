import Link from "next/link"
import { eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"
import { db } from "@/db"
import { entities, people, artifacts, topics, type MaterialType } from "@/db/schema"
import { createMaterial } from "../actions"
import { MaterialForm } from "@/components/MaterialForm"

type Props = {
    searchParams: Promise<{ entityId?: string; materialType?: MaterialType }>
}

export default async function NewMaterialPage({ searchParams }: Props) {
    const { entityId, materialType } = await searchParams

    const [entityRows, topicRows] = await Promise.all([
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
    ])

    const entitiesList = entityRows.map((r) => ({
        id: r.id,
        type: r.type,
        displayName: r.personName ?? r.artifactTitle ?? r.id.toString(),
    }))

    const numericEntityId = entityId ? Number(entityId) : null
    const sourceEntity = numericEntityId
        ? entityRows.find((r) => r.id === numericEntityId)
        : null
    const backHref = sourceEntity
        ? sourceEntity.type === "artifact"
            ? `/admin/artifacts/${sourceEntity.id}`
            : `/admin/people/${sourceEntity.id}`
        : null

    return (
        <div className="py-6">
            {backHref && (
                <div className="mb-6">
                    <Link
                        href={backHref}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors w-fit"
                    >
                        <ArrowLeft size={15} />
                        Назад
                    </Link>
                </div>
            )}
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
