export const dynamic = "force-dynamic"

import Link from "next/link"
import { db } from "@/db"
import { entities, people, materials, materialTopics, events, eventTopics } from "@/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { PageHero } from "@/components/PageHero"
import { BackButton } from "@/components/BackButton"
import { WarTimeline } from "@/components/WarTimeline"
import { WarPhotoGrid } from "@/components/WarPhotoGrid"
import { warPeopleTabGroups } from "@/lib/warSections"
import { getWarPeopleBuckets } from "@/lib/warPeople"

const warStatGroups = [
    {
        title: warPeopleTabGroups[0].title,
        items: [
            {
                title: warPeopleTabGroups[0].items[0].label,
                tabKey: warPeopleTabGroups[0].items[0].key,
                href: `/war/people?tab=${warPeopleTabGroups[0].items[0].key}`,
            },
            {
                title: warPeopleTabGroups[0].items[1].label,
                tabKey: warPeopleTabGroups[0].items[1].key,
                href: `/war/people?tab=${warPeopleTabGroups[0].items[1].key}`,
            },
        ],
    },
    {
        title: warPeopleTabGroups[1].title,
        items: [
            {
                title: warPeopleTabGroups[1].items[0].label,
                tabKey: warPeopleTabGroups[1].items[0].key,
                href: `/war/people?tab=${warPeopleTabGroups[1].items[0].key}`,
            },
            {
                title: warPeopleTabGroups[1].items[1].label,
                tabKey: warPeopleTabGroups[1].items[1].key,
                href: `/war/people?tab=${warPeopleTabGroups[1].items[1].key}`,
            },
        ],
    },
] as const

export default async function WarPage() {
    const { warTopic, counts } = await getWarPeopleBuckets()

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

    const [timelineEvents, warPhotos] = await Promise.all([
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
            .where(eq(eventTopics.topicId, warTopic.id))
            .orderBy(asc(events.yearFrom)),
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
                    eq(materialTopics.topicId, warTopic.id),
                    eq(materials.materialType, "photo"),
                    eq(materials.status, "published"),
                ),
            )
            .orderBy(asc(materials.yearFrom))
            .limit(9),
    ])

    return (
        <>
            <PageHero title="Война" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <BackButton />
                </div>

                <section className="mb-10">
                    <div className="space-y-8">
                        {warStatGroups.map((group) => (
                            <div key={group.title}>
                                <h2 className="text-lg font-semibold text-ink mb-4">
                                    {group.title}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {group.items.map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href}
                                            className="group relative overflow-hidden rounded-2xl bg-paper-dark border border-paper-border min-h-44 px-5 py-5 flex items-end"
                                        >
                                            <div className="absolute inset-y-0 right-3 flex items-center text-[5.5rem] leading-none font-semibold tracking-[-0.08em] text-ink/10 tabular-nums transition-transform duration-300 group-hover:scale-105 sm:text-[6.5rem]">
                                                {counts[item.tabKey]}
                                            </div>
                                            <div className="relative z-10 max-w-[60%]">
                                                <p className="text-base font-semibold text-ink leading-snug">
                                                    {item.title}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="mb-8">
                    <p className="text-ink-muted text-sm leading-relaxed pt-4">
                        Работники Пролетарки в годы Великой Отечественной войны — те, кто ушёл на
                        фронт, кто остался у станка и кто не вернулся.
                    </p>
                </div>

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
