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
import {
    getWarPeopleBuckets,
    getWarTopicPeople,
    WAR_234_DIVISION_TOPIC_CODE,
    WAR_HOME_FRONT_WORKERS_TOPIC_CODE,
    WAR_PRISONERS_TOPIC_CODE,
} from "@/lib/warPeople"
import { getWarTimeline } from "@/lib/warTimeline"

const warStatGroups = [
    {
        title: warPeopleTabGroups[0].title,
        items: [
            {
                title: warPeopleTabGroups[0].items[0].label,
                tabKey: warPeopleTabGroups[0].items[0].key,
                href: `/war/people?tab=${warPeopleTabGroups[0].items[0].key}`,
                background: "/cards/war-1.jpg",
            },
            {
                title: warPeopleTabGroups[0].items[1].label,
                tabKey: warPeopleTabGroups[0].items[1].key,
                href: `/war/people?tab=${warPeopleTabGroups[0].items[1].key}`,
                background: "/cards/war-2.jpg",
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
                background: "/cards/war-3.jpg",
            },
            {
                title: warPeopleTabGroups[1].items[1].label,
                tabKey: warPeopleTabGroups[1].items[1].key,
                href: `/war/people?tab=${warPeopleTabGroups[1].items[1].key}`,
                background: "/cards/war-4.jpg",
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

    const [timelineEvents, showcaseRow, division234, homeFrontWorkers, prisoners] =
        await Promise.all([
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
            getWarTopicPeople(WAR_234_DIVISION_TOPIC_CODE),
            getWarTopicPeople(WAR_HOME_FRONT_WORKERS_TOPIC_CODE),
            getWarTopicPeople(WAR_PRISONERS_TOPIC_CODE),
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

                <div className="mb-8">
                    <p className="text-ink-muted text-sm leading-relaxed pt-4">
                        Работники Пролетарки в годы Великой Отечественной войны — те, кто ушёл на
                        фронт, кто остался у станка и кто не вернулся.
                    </p>
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
                        <h2 className="text-lg font-semibold text-ink">Прошедшие войну</h2>
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
                                            <img
                                                src={item.background}
                                                alt=""
                                                className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-paper-dark/35" />
                                            <div className="absolute inset-y-0 right-3 flex items-center text-[5.5rem] leading-none font-semibold tracking-[-0.08em] text-ink/25 tabular-nums transition-transform duration-300 group-hover:scale-105 sm:text-[6.5rem]">
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

                <section className="border-t border-paper-border pt-8 mb-10">
                    <div className="mb-4 flex items-baseline justify-between gap-3">
                        <h2 className="text-lg font-semibold text-ink">234 стрелковая дивизия</h2>
                        <span className="text-xs text-ink-muted tabular-nums">
                            {division234.count}
                        </span>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-ink-muted">
                        234-я стрелковая дивизия (2-го формирования), известная как «Ярославская
                        коммунистическая», была сформирована в октябре-ноябре 1941 года из
                        добровольцев Ярославской области. Состояли в ней и работники Пролетарки,
                        ушедшие на фронт в первые месяцы войны.
                    </p>
                    <Link
                        href="/war/234-division"
                        className="group relative block overflow-hidden rounded-[2rem] border border-paper-border bg-paper-dark px-6 py-6 sm:px-7 sm:py-7"
                    >
                        <img
                            src="/cards/234div.jpg"
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-paper-dark/35" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_60%),radial-gradient(circle_at_top_right,rgba(0,0,0,0.1),transparent_45%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative flex items-start justify-between gap-5">
                            <div className="max-w-lg">
                                <p className="text-xl font-semibold leading-tight text-ink sm:text-2xl">
                                    Открыть список
                                </p>
                                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
                                    {division234.count > 0
                                        ? "Имена тех, чьи военные истории связаны с 234-й стрелковой дивизией."
                                        : "Этот список ещё ждёт своих имён и свидетельств."}
                                </p>
                            </div>
                            <div className="flex min-h-16 min-w-16 shrink-0 items-center justify-center rounded-full border border-paper-border bg-paper px-4 text-3xl font-semibold tabular-nums tracking-[-0.06em] text-ink">
                                {division234.count}
                            </div>
                        </div>
                    </Link>
                </section>

                <section className="border-t border-paper-border pt-8 mb-10">
                    <div className="mb-4 flex items-baseline justify-between gap-3">
                        <h2 className="text-lg font-semibold text-ink">Труженики тыла</h2>
                        <span className="text-xs text-ink-muted tabular-nums">
                            {homeFrontWorkers.count}
                        </span>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-ink-muted">
                        Работники, которые в годы войны поддерживали производство, хозяйство и
                        повседневную жизнь завода вдали от фронта.
                    </p>
                    <Link
                        href="/war/home-front-workers"
                        className="group relative block overflow-hidden rounded-[2rem] border border-paper-border bg-paper-dark px-6 py-6 sm:px-7 sm:py-7"
                    >
                        <img
                            src="/cards/homeworkers.jpg"
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-paper-dark/35" />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2),transparent_60%),radial-gradient(circle_at_top_right,rgba(0,0,0,0.08),transparent_45%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative flex items-start justify-between gap-5">
                            <div className="max-w-lg">
                                <p className="text-xl font-semibold leading-tight text-ink sm:text-2xl">
                                    Открыть список
                                </p>
                                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
                                    {homeFrontWorkers.count > 0
                                        ? "Имена тех, чья военная история прошла через работу, заботу и стойкость в тылу."
                                        : "Этот список ещё ждёт своих имён и свидетельств."}
                                </p>
                            </div>
                            <div className="flex min-h-16 min-w-16 shrink-0 items-center justify-center rounded-full border border-paper-border bg-paper px-4 text-3xl font-semibold tabular-nums tracking-[-0.06em] text-ink">
                                {homeFrontWorkers.count}
                            </div>
                        </div>
                    </Link>
                </section>

                <section className="border-t border-paper-border pt-8 mb-10">
                    <div className="mb-4 flex items-baseline justify-between gap-3">
                        <h2 className="text-lg font-semibold text-ink">В фашистской неволе</h2>
                        <span className="text-xs text-ink-muted tabular-nums">
                            {prisoners.count}
                        </span>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-ink-muted">
                        Судьбы людей, прошедших через плен, оккупацию, принудительную разлуку с
                        домом и тяжёлый путь возвращения к мирной жизни.
                    </p>
                    <Link
                        href="/war/prisoners"
                        className="group relative block overflow-hidden rounded-[2rem] border border-paper-border bg-paper-dark px-6 py-6 sm:px-7 sm:py-7"
                    >
                        <img
                            src="/cards/prisoners.jpg"
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-paper-dark/35" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.08),transparent_45%),linear-gradient(135deg,rgba(255,255,255,0.22),transparent_62%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="relative flex items-start justify-between gap-5">
                            <div className="max-w-lg">
                                <p className="text-xl font-semibold leading-tight text-ink sm:text-2xl">
                                    Открыть список
                                </p>
                                <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-secondary">
                                    {prisoners.count > 0
                                        ? "Имена тех, чья память хранит неволю, ожидание и возвращение домой."
                                        : "Этот список ещё ждёт своих имён и свидетельств."}
                                </p>
                            </div>
                            <div className="flex min-h-16 min-w-16 shrink-0 items-center justify-center rounded-full border border-paper-border bg-paper px-4 text-3xl font-semibold tabular-nums tracking-[-0.06em] text-ink">
                                {prisoners.count}
                            </div>
                        </div>
                    </Link>
                </section>

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
