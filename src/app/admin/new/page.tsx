import Link from "next/link"
import { eq } from "drizzle-orm"
import { ArrowLeft } from "lucide-react"
import { db } from "@/db"
import { entities, people, artifacts, topics, type MaterialType } from "@/db/schema"
import { createMaterial } from "../actions"
import { MaterialForm } from "@/components/MaterialForm"
import { getBackHref, parseBackstack, serializeBackstack } from "@/lib/adminBackstack"

type Props = {
    searchParams: Promise<{
        entityId?: string
        materialType?: MaterialType
        sectionId?: string
        personId?: string
        backstack?: string
    }>
}

export default async function NewMaterialPage({ searchParams }: Props) {
    const { entityId, materialType, sectionId, personId, backstack } = await searchParams
    const numericPersonId = personId ? Number(personId) : null
    const currentBackstack = parseBackstack(backstack)

    const [entityRows, topicRows, selectedPeople] = await Promise.all([
        db
            .select({
                id: entities.id,
                type: entities.type,
                personName: people.name,
                personCode: people.code,
                artifactTitle: artifacts.title,
                artifactCode: artifacts.code,
            })
            .from(entities)
            .leftJoin(people, eq(entities.personId, people.id))
            .leftJoin(artifacts, eq(entities.artifactId, artifacts.id)),
        db.select({ id: topics.id, title: topics.title }).from(topics),
        numericPersonId
            ? db
                  .select({ id: people.id, name: people.name })
                  .from(people)
                  .where(eq(people.id, numericPersonId))
            : Promise.resolve([]),
    ])

    const entitiesList = entityRows.map((r) => ({
        id: r.id,
        type: r.type,
        displayName: r.personName ?? r.artifactTitle ?? r.id.toString(),
    }))

    const numericEntityId = entityId ? Number(entityId) : null
    const sourceEntity = numericEntityId ? entityRows.find((r) => r.id === numericEntityId) : null
    const sourceBackHref = sourceEntity
        ? sourceEntity.type === "artifact"
            ? `/admin/artifacts/${sourceEntity.artifactCode}`
            : `/admin/people/${sourceEntity.personCode}`
        : null
    const backHref = getBackHref(currentBackstack, sourceBackHref ?? "/admin/materials")
    const createBackstack =
        currentBackstack.length > 0
            ? serializeBackstack(currentBackstack)
            : sourceBackHref
              ? serializeBackstack([sourceBackHref])
              : undefined

    return (
        <div className="py-6">
            <div className="mb-6">
                <Link
                    href={backHref}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors w-fit"
                >
                    <ArrowLeft size={15} />
                    Назад
                </Link>
            </div>
            <h1 className="text-xl font-bold mb-6">Новый материал</h1>
            <MaterialForm
                action={createMaterial}
                entities={entitiesList}
                topics={topicRows}
                people={selectedPeople}
                selectedPersonIds={numericPersonId ? [numericPersonId] : []}
                defaultEntityId={entityId ? Number(entityId) : undefined}
                defaultMaterialType={materialType}
                materialTypeLocked={Boolean(materialType)}
                defaultSectionId={sectionId ? Number(sectionId) : undefined}
                backstack={createBackstack}
            />
        </div>
    )
}
