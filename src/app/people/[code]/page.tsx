import { notFound } from "next/navigation"
import { eq, and, asc, inArray } from "drizzle-orm"
import { db } from "@/db"
import {
    entities,
    people,
    materials,
    personMaterials,
    personSources,
    sources,
    events,
    eventTopics,
    topics,
} from "@/db/schema"
import { PageHero } from "@/components/PageHero"
import { PersonTabs } from "@/components/PersonTabs"
import { PersonTimeline } from "@/components/PersonTimeline"
import { BackButton } from "@/components/BackButton"
import { CommentsSection } from "@/components/comments/CommentsSection"
import { fetchMaterialSourcesMap } from "@/db/queries"

type Props = {
    params: Promise<{ code: string }>
    searchParams: Promise<{ page?: string; sort?: "date_desc" | "date_asc" }>
}

function formatYears(
    birthYear: number | null,
    deathYear: number | null,
    yearsLabel: string | null,
) {
    if (birthYear || deathYear) {
        return `${birthYear ?? "?"}–${deathYear ?? "..."}`
    }
    return yearsLabel ?? null
}

export default async function PersonPage({ params, searchParams }: Props) {
    const { code } = await params
    const { page: pageParam, sort = "date_desc" } = await searchParams
    const commentsPage = Math.max(1, Number(pageParam) || 1)

    const [row] = await db
        .select({ entity: entities, person: people })
        .from(entities)
        .innerJoin(people, eq(entities.personId, people.id))
        .where(eq(people.code, code))
        .limit(1)

    if (!row) notFound()

    const { entity, person } = row

    type LinkedPerson = {
        code: string
        name: string
    }

    const [nativeMaterials, groupPhotoMaterials, eventRows, personSourceRows] = await Promise.all([
        db
            .select({
                id: materials.id,
                title: materials.title,
                summary: materials.summary,
                content: materials.content,
                coverImagePath: materials.coverImagePath,
                yearFrom: materials.yearFrom,
                yearTo: materials.yearTo,
                materialType: materials.materialType,
            })
            .from(materials)
            .where(and(eq(materials.entityId, entity.id), eq(materials.status, "published"))),
        db
            .select({
                id: materials.id,
                title: materials.title,
                summary: materials.summary,
                content: materials.content,
                coverImagePath: materials.coverImagePath,
                yearFrom: materials.yearFrom,
                yearTo: materials.yearTo,
                materialType: materials.materialType,
            })
            .from(personMaterials)
            .innerJoin(materials, eq(personMaterials.materialId, materials.id))
            .where(
                and(
                    eq(personMaterials.personId, person.id),
                    eq(materials.status, "published"),
                    eq(materials.materialType, "group_photo"),
                ),
            ),
        db
            .select({
                id: events.id,
                text: events.text,
                yearFrom: events.yearFrom,
                yearTo: events.yearTo,
                yearsLabel: events.yearsLabel,
                topicTitle: topics.title,
            })
            .from(events)
            .leftJoin(eventTopics, eq(eventTopics.eventId, events.id))
            .leftJoin(topics, eq(topics.id, eventTopics.topicId))
            .where(eq(events.entityId, entity.id))
            .orderBy(asc(events.yearFrom), asc(events.id)),
        db
            .select({
                id: sources.id,
                label: sources.label,
                url: sources.url,
            })
            .from(personSources)
            .innerJoin(sources, eq(personSources.sourceId, sources.id))
            .where(eq(personSources.personId, person.id))
            .orderBy(asc(sources.label), asc(sources.id)),
    ])

    const groupPhotoIds = groupPhotoMaterials.map((item) => item.id)
    const materialIds = [...nativeMaterials, ...groupPhotoMaterials].map((material) => material.id)
    const linkedPeopleRows = groupPhotoIds.length
        ? await db
              .select({
                  materialId: personMaterials.materialId,
                  code: people.code,
                  name: people.name,
              })
              .from(personMaterials)
              .innerJoin(people, eq(personMaterials.personId, people.id))
              .where(inArray(personMaterials.materialId, groupPhotoIds))
        : []
    const materialSourcesMap = await fetchMaterialSourcesMap(materialIds)

    const linkedPeopleMap = new Map<number, LinkedPerson[]>()
    for (const row of linkedPeopleRows) {
        if (row.code === person.code) continue
        if (!linkedPeopleMap.has(row.materialId)) linkedPeopleMap.set(row.materialId, [])
        linkedPeopleMap.get(row.materialId)!.push({ code: row.code, name: row.name })
    }

    const normalizedGroupPhotos = groupPhotoMaterials.map((material) => ({
        ...material,
        sources: materialSourcesMap.get(material.id) ?? [],
        linkedPeople: linkedPeopleMap.get(material.id) ?? [],
    }))

    const linkedMaterials = [
        ...nativeMaterials.map((material) => ({
            ...material,
            sources: materialSourcesMap.get(material.id) ?? [],
        })),
        ...normalizedGroupPhotos.filter(
            (groupPhoto) => !nativeMaterials.some((material) => material.id === groupPhoto.id),
        ),
    ]

    // Группируем темы по событию
    const eventsMap = new Map<
        number,
        {
            id: number
            text: string
            yearFrom: number | null
            yearTo: number | null
            yearsLabel: string | null
            topicTitles: string[]
        }
    >()
    for (const row of eventRows) {
        if (!eventsMap.has(row.id)) {
            eventsMap.set(row.id, {
                id: row.id,
                text: row.text,
                yearFrom: row.yearFrom,
                yearTo: row.yearTo,
                yearsLabel: row.yearsLabel,
                topicTitles: [],
            })
        }
        if (row.topicTitle) eventsMap.get(row.id)!.topicTitles.push(row.topicTitle)
    }
    const entityEvents = Array.from(eventsMap.values())

    const articles = linkedMaterials.filter((m) => m.materialType === "article")
    const news = linkedMaterials.filter((m) => m.materialType === "news")
    const photos = linkedMaterials.filter(
        (m) => m.materialType === "photo" || m.materialType === "group_photo",
    )
    const documents = linkedMaterials.filter((m) => m.materialType === "document")

    const years = formatYears(person.birthYear, person.deathYear, person.yearsLabel)

    return (
        <>
            <PageHero title={person.name} />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <BackButton />
                </div>
                <div className="flex gap-6 mb-8">
                    <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-paper-dark">
                        {(() => {
                            const avatarSrc =
                                person.mainPhotoPath ??
                                linkedMaterials.find(
                                    (m) =>
                                        (m.materialType === "photo" ||
                                            m.materialType === "group_photo") &&
                                        m.coverImagePath,
                                )?.coverImagePath ??
                                null
                            return avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt={person.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-ink-muted text-4xl font-light">
                                    {person.name[0]}
                                </div>
                            )
                        })()}
                    </div>
                    <div className="flex flex-col justify-center">
                        {years && <p className="text-sm text-ink-muted">{years}</p>}
                        {person.shortBio && (
                            <p className="text-sm text-ink-secondary mt-2">{person.shortBio}</p>
                        )}
                        {personSourceRows.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs text-ink-muted mb-1">Внешние источники</p>
                                <ol className="list-decimal pl-4 space-y-1">
                                    {personSourceRows.map((source) => (
                                        <li key={source.id} className="text-xs text-ink-muted">
                                            <a
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sepia hover:underline"
                                            >
                                                {source.label}
                                            </a>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                </div>

                <PersonTimeline events={entityEvents} />

                <PersonTabs articles={articles} news={news} photos={photos} documents={documents} />

                <CommentsSection entityId={entity.id} page={commentsPage} sort={sort} />
            </main>
        </>
    )
}
