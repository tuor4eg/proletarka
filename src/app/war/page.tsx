export const dynamic = "force-dynamic"

import { db } from "@/db"
import {
    entities,
    people,
    materials,
    materialTopics,
    events,
    eventTopics,
    topics,
} from "@/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { fetchFirstPhotoMap } from "@/db/queries"
import { PageHero } from "@/components/PageHero"
import { WarTimeline } from "@/components/WarTimeline"
import { WarPhotoGrid } from "@/components/WarPhotoGrid"
import { PersonCardRow } from "@/components/PersonCardRow"
import { WAR_YEAR_FROM, WAR_YEAR_TO } from "@/lib/constants"

function formatYears(
    birthYear: number | null,
    deathYear: number | null,
    yearsLabel: string | null,
) {
    if (birthYear || deathYear) return `${birthYear ?? "?"}–${deathYear ?? "..."}`
    return yearsLabel ?? null
}

export default async function WarPage() {
    const [warTopic] = await db
        .select({ id: topics.id })
        .from(topics)
        .where(eq(topics.code, "war"))
        .limit(1)

    if (!warTopic) {
        return (
            <>
                <PageHero title="Война" />
                <main className="max-w-2xl mx-auto px-4 py-8">
                    <p className="text-sm text-ink-muted">Раздел в разработке.</p>
                </main>
            </>
        )
    }

    const warId = warTopic.id

    const [warPeopleFromEvents, warPeopleFromMaterials, timelineEvents, warPhotos] =
        await Promise.all([
            // Люди, у которых есть события с тегом war
            db
                .selectDistinct({
                    entityId: entities.id,
                    code: people.code,
                    name: people.name,
                    birthYear: people.birthYear,
                    deathYear: people.deathYear,
                    yearsLabel: people.yearsLabel,
                    mainPhotoPath: people.mainPhotoPath,
                    shortBio: people.shortBio,
                })
                .from(entities)
                .innerJoin(people, eq(entities.personId, people.id))
                .innerJoin(events, eq(events.entityId, entities.id))
                .innerJoin(eventTopics, eq(eventTopics.eventId, events.id))
                .where(eq(eventTopics.topicId, warId)),

            // Люди, у которых есть опубликованные материалы с тегом war
            db
                .selectDistinct({
                    entityId: entities.id,
                    code: people.code,
                    name: people.name,
                    birthYear: people.birthYear,
                    deathYear: people.deathYear,
                    yearsLabel: people.yearsLabel,
                    mainPhotoPath: people.mainPhotoPath,
                    shortBio: people.shortBio,
                })
                .from(entities)
                .innerJoin(people, eq(entities.personId, people.id))
                .innerJoin(materials, eq(materials.entityId, entities.id))
                .innerJoin(materialTopics, eq(materialTopics.materialId, materials.id))
                .where(and(eq(materialTopics.topicId, warId), eq(materials.status, "published"))),

            // События с тегом war, отсортированные по году
            db
                .select({
                    id: events.id,
                    text: events.text,
                    yearFrom: events.yearFrom,
                    yearTo: events.yearTo,
                    yearsLabel: events.yearsLabel,
                    entityId: events.entityId,
                    personName: people.name,
                    personCode: people.code,
                })
                .from(events)
                .innerJoin(eventTopics, eq(eventTopics.eventId, events.id))
                .innerJoin(entities, eq(entities.id, events.entityId))
                .innerJoin(people, eq(people.id, entities.personId))
                .where(eq(eventTopics.topicId, warId))
                .orderBy(asc(events.yearFrom)),

            // Фотографии с тегом war
            db
                .select({
                    id: materials.id,
                    title: materials.title,
                    coverImagePath: materials.coverImagePath,
                    yearFrom: materials.yearFrom,
                    yearTo: materials.yearTo,
                })
                .from(materials)
                .innerJoin(materialTopics, eq(materialTopics.materialId, materials.id))
                .where(
                    and(
                        eq(materialTopics.topicId, warId),
                        eq(materials.materialType, "photo"),
                        eq(materials.status, "published"),
                    ),
                )
                .orderBy(asc(materials.yearFrom))
                .limit(9),
        ])

    // Объединяем людей из обоих источников, убираем дубли
    const warPeopleMap = new Map<number, (typeof warPeopleFromEvents)[0]>()
    for (const p of [...warPeopleFromEvents, ...warPeopleFromMaterials]) {
        if (!warPeopleMap.has(p.entityId)) warPeopleMap.set(p.entityId, p)
    }
    const allWarPeople = Array.from(warPeopleMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "ru"),
    )

    const noPhotoIds = allWarPeople.filter((p) => !p.mainPhotoPath).map((p) => p.entityId)
    const fallbackMap = await fetchFirstPhotoMap(noPhotoIds)

    const fallenPeople = allWarPeople.filter(
        (p) => p.deathYear !== null && p.deathYear >= WAR_YEAR_FROM && p.deathYear <= WAR_YEAR_TO,
    )

    return (
        <>
            <PageHero title="Война" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <p className="text-ink-muted text-sm leading-relaxed pt-4">
                        Работники Пролетарки в годы Великой Отечественной войны — те, кто ушёл на
                        фронт, кто остался у станка и кто не вернулся.
                    </p>
                </div>

                {/* Блок 1: Погибшие */}
                <section className="mb-10">
                    <div className="flex items-baseline justify-between mb-4">
                        <h2 className="text-lg font-semibold text-ink">Погибшие</h2>
                        {fallenPeople.length > 0 && (
                            <span className="text-xs text-ink-muted">{fallenPeople.length}</span>
                        )}
                    </div>
                    {fallenPeople.length === 0 ? (
                        <div className="text-sm text-ink-muted italic">— нет данных —</div>
                    ) : (
                        <PersonCardRow
                            people={fallenPeople.map((p) => ({
                                entityId: p.entityId,
                                code: p.code,
                                name: p.name,
                                years: formatYears(p.birthYear, p.deathYear, p.yearsLabel),
                                mainPhotoPath:
                                    p.mainPhotoPath ?? fallbackMap.get(p.entityId) ?? null,
                            }))}
                        />
                    )}
                </section>

                {/* Блок 2: Люди войны */}
                <section className="mb-10">
                    <div className="flex items-baseline justify-between mb-4">
                        <h2 className="text-lg font-semibold text-ink">Люди войны</h2>
                        {allWarPeople.length > 0 && (
                            <span className="text-xs text-ink-muted">{allWarPeople.length}</span>
                        )}
                    </div>
                    {allWarPeople.length === 0 ? (
                        <div className="text-sm text-ink-muted italic">— нет данных —</div>
                    ) : (
                        <PersonCardRow
                            people={allWarPeople.map((p) => ({
                                entityId: p.entityId,
                                code: p.code,
                                name: p.name,
                                years: formatYears(p.birthYear, p.deathYear, p.yearsLabel),
                                mainPhotoPath:
                                    p.mainPhotoPath ?? fallbackMap.get(p.entityId) ?? null,
                            }))}
                        />
                    )}
                </section>

                {/* Блок 3: Хронология */}
                <section className="mb-10">
                    <div className="flex items-baseline justify-between mb-4">
                        <h2 className="text-lg font-semibold text-ink">Хронология</h2>
                        {timelineEvents.length > 0 && (
                            <span className="text-xs text-ink-muted">{timelineEvents.length}</span>
                        )}
                    </div>
                    {timelineEvents.length === 0 ? (
                        <div className="text-sm text-ink-muted italic">— нет данных —</div>
                    ) : (
                        <WarTimeline events={timelineEvents} />
                    )}
                </section>

                {/* Блок 4: Фото войны */}
                <section className="mb-10">
                    <div className="flex items-baseline justify-between mb-4">
                        <h2 className="text-lg font-semibold text-ink">Фото войны</h2>
                        {warPhotos.length > 0 && (
                            <span className="text-xs text-ink-muted">{warPhotos.length}</span>
                        )}
                    </div>
                    {warPhotos.length === 0 ? (
                        <div className="text-sm text-ink-muted italic">— нет данных —</div>
                    ) : (
                        <WarPhotoGrid photos={warPhotos} />
                    )}
                </section>
            </main>
        </>
    )
}
