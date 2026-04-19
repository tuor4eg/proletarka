export const dynamic = "force-dynamic"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { db } from "@/db"
import { entities, materials, showcases, artifacts } from "@/db/schema"
import { eq, and, asc, isNotNull } from "drizzle-orm"
import { PageHero } from "@/components/PageHero"
import { BackButton } from "@/components/BackButton"
import { PhotoCarousel } from "@/components/PhotoCarousel"
import { fetchMaterialSourcesMap, type SourceLink } from "@/db/queries"
import { warPeopleTabGroups } from "@/lib/warSections"
import { getWarPeopleBuckets } from "@/lib/warPeople"
import { getWarTimeline } from "@/lib/warTimeline"

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

    const [timelineEvents, showcaseRow] = await Promise.all([
        getWarTimeline(warTopic.id),
        db
            .select({
                artifactId: showcases.artifactId,
                title: artifacts.title,
                description: artifacts.description,
            })
            .from(showcases)
            .innerJoin(artifacts, eq(artifacts.id, showcases.artifactId))
            .where(eq(showcases.sectionCode, "war"))
            .limit(1),
    ])

    const showcaseMeta = showcaseRow[0]
        ? { title: showcaseRow[0].title, description: showcaseRow[0].description }
        : null
    let showcasePhotos: {
        id: number
        title: string
        coverImagePath: string
        yearFrom: number | null
        yearTo: number | null
        content: string | null
        sources: SourceLink[]
    }[] = []

    if (showcaseRow[0]) {
        const [entity] = await db
            .select({ id: entities.id })
            .from(entities)
            .where(eq(entities.artifactId, showcaseRow[0].artifactId))
            .limit(1)

        if (entity) {
            const rows = (await db
                .select({
                    id: materials.id,
                    title: materials.title,
                    coverImagePath: materials.coverImagePath,
                    yearFrom: materials.yearFrom,
                    yearTo: materials.yearTo,
                    content: materials.content,
                })
                .from(materials)
                .where(
                    and(
                        eq(materials.entityId, entity.id),
                        eq(materials.materialType, "photo"),
                        eq(materials.status, "published"),
                        isNotNull(materials.coverImagePath),
                    ),
                )
                .orderBy(asc(materials.position), asc(materials.id))) as Array<
                Omit<(typeof showcasePhotos)[number], "sources">
            >

            const sourcesMap = await fetchMaterialSourcesMap(rows.map((row) => row.id))
            showcasePhotos = rows.map((row) => ({
                ...row,
                sources: sourcesMap.get(row.id) ?? [],
            }))
        }
    }

    return (
        <>
            <PageHero title="Война" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <BackButton />
                </div>

                {showcasePhotos.length > 0 && (
                    <section className="border-t border-paper-border pt-8 mb-10">
                        {showcaseMeta && (
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-ink">
                                    {showcaseMeta.title}
                                </h2>
                                {showcaseMeta.description && (
                                    <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
                                        {showcaseMeta.description}
                                    </p>
                                )}
                            </div>
                        )}
                        <PhotoCarousel photos={showcasePhotos} />
                    </section>
                )}

                <section className="border-t border-paper-border pt-8 mb-10">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-ink">Списки участников</h2>
                    </div>
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

                <section className="border-t border-paper-border pt-8 mb-10">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-ink">Военная хронология</h2>
                    </div>
                    <Link
                        href="/war/timeline"
                        className="group relative block overflow-hidden rounded-[2rem] border border-paper-border bg-paper-dark px-6 py-6 sm:px-7 sm:py-7"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,0,0,0.08),_transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.24),transparent_60%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative flex items-start justify-between gap-4">
                            <div className="max-w-lg">
                                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-ink-muted">
                                    <span>1939-1940-е</span>
                                    {timelineEvents.length > 0 && (
                                        <span className="rounded-full border border-paper-border bg-paper px-2 py-0.5 tracking-normal normal-case">
                                            {timelineEvents.length} событий
                                        </span>
                                    )}
                                </div>
                                <p className="text-xl font-semibold leading-tight text-ink sm:text-2xl">
                                    Открыть полную ленту военных и послевоенных событий
                                </p>
                                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
                                    От мобилизации и фронта до возвращения домой, потерь и памятных
                                    дат.
                                </p>
                            </div>
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-paper-border bg-paper text-ink-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-ink">
                                <ArrowRight size={20} />
                            </span>
                        </div>
                    </Link>
                </section>
            </main>
        </>
    )
}
