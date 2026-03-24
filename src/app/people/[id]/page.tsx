import { notFound } from "next/navigation"
import { eq, and, asc } from "drizzle-orm"
import { db } from "@/db"
import { entities, people, materials, events, eventTopics, topics } from "@/db/schema"
import { PublicNavWrapper } from "@/components/PublicNavWrapper"
import { PersonTabs } from "@/components/PersonTabs"
import { PersonTimeline } from "@/components/PersonTimeline"
import { BackButton } from "@/components/BackButton"

type Props = {
    params: Promise<{ id: string }>
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

export default async function PersonPage({ params }: Props) {
    const { id } = await params
    const numericId = Number(id)

    if (!Number.isInteger(numericId) || numericId <= 0) notFound()

    const [row] = await db
        .select({ entity: entities, person: people })
        .from(entities)
        .innerJoin(people, eq(entities.personId, people.id))
        .where(eq(entities.id, numericId))
        .limit(1)

    if (!row) notFound()

    const { person } = row

    const [linkedMaterials, eventRows] = await Promise.all([
        db
            .select({
                id: materials.id,
                title: materials.title,
                summary: materials.summary,
                coverImagePath: materials.coverImagePath,
                yearFrom: materials.yearFrom,
                yearTo: materials.yearTo,
                sourceUrl: materials.sourceUrl,
                materialType: materials.materialType,
            })
            .from(materials)
            .where(and(eq(materials.entityId, numericId), eq(materials.status, "published"))),
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
            .where(eq(events.entityId, numericId))
            .orderBy(asc(events.yearFrom), asc(events.id)),
    ])

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
    const photos = linkedMaterials.filter((m) => m.materialType === "photo")
    const documents = linkedMaterials.filter((m) => m.materialType === "document")

    const years = formatYears(person.birthYear, person.deathYear, person.yearsLabel)

    return (
        <>
            <PublicNavWrapper />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <BackButton />
                </div>
                <div className="flex gap-6 mb-8">
                    <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-gray-100">
                        {person.mainPhotoPath ? (
                            <img
                                src={person.mainPhotoPath}
                                alt={person.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-light">
                                {person.name[0]}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-2xl font-bold">{person.name}</h1>
                        {years && <p className="text-sm text-gray-400 mt-1">{years}</p>}
                        {person.shortBio && (
                            <p className="text-sm text-gray-600 mt-2">{person.shortBio}</p>
                        )}
                    </div>
                </div>

                <PersonTimeline events={entityEvents} />

                <PersonTabs articles={articles} photos={photos} documents={documents} />
            </main>
        </>
    )
}
