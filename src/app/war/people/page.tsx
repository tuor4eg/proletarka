export const dynamic = "force-dynamic"

import Link from "next/link"
import { PageHero } from "@/components/PageHero"
import { BackButton } from "@/components/BackButton"
import { PersonCardRow } from "@/components/PersonCardRow"
import { LetterFilter } from "@/components/LetterFilter"
import { Pagination } from "@/components/Pagination"
import {
    defaultWarPeopleTab,
    warPeopleTabGroups,
    warPeopleTabs,
    type WarPeopleTabKey,
} from "@/lib/warSections"
import { getWarPeopleBuckets, formatWarPersonYears } from "@/lib/warPeople"

type Props = {
    searchParams: Promise<{ tab?: string; letter?: string; page?: string }>
}

const PAGE_SIZE = 20

const tabClass = (active: boolean) =>
    `text-sm px-3 py-1.5 rounded-lg transition-colors ${
        active
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
    }`

function isWarPeopleTabKey(value: string | undefined): value is WarPeopleTabKey {
    return warPeopleTabGroups.some((group) => group.items.some((item) => item.key === value))
}

export default async function WarPeoplePage({ searchParams }: Props) {
    const { tab, letter, page: pageParam } = await searchParams
    const activeTab = isWarPeopleTabKey(tab) ? tab : defaultWarPeopleTab
    const page = Math.max(1, Number(pageParam) || 1)

    const { warTopic, buckets, counts, availableLettersByTab, fallbackMap } =
        await getWarPeopleBuckets()

    const activeLabel =
        warPeopleTabs.find((item) => item.key === activeTab)?.label ?? "Участники войны"

    const tabPeople = buckets[activeTab]
    const filteredPeople = letter
        ? tabPeople.filter((person) => person.name.toUpperCase().startsWith(letter.toUpperCase()))
        : tabPeople
    const totalPages = Math.ceil(filteredPeople.length / PAGE_SIZE)
    const pagedPeople = filteredPeople.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <>
            <PageHero title="Участники войны" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <BackButton />
                </div>

                <div className="mb-8 grid gap-4 md:grid-cols-2">
                    {warPeopleTabGroups.map((group) => (
                        <div key={group.title}>
                            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted mb-2">
                                {group.title}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {group.items.map((item) => (
                                    <Link
                                        key={item.key}
                                        href={`/war/people?tab=${item.key}`}
                                        className={tabClass(item.key === activeTab)}
                                    >
                                        {item.label}{" "}
                                        <span className="text-xs opacity-70">
                                            {counts[item.key]}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {!warTopic ? (
                    <p className="text-sm text-ink-muted">Раздел в разработке.</p>
                ) : (
                    <section>
                        <div className="flex items-baseline justify-between mb-4">
                            <h2 className="text-lg font-semibold text-ink">{activeLabel}</h2>
                            {filteredPeople.length > 0 && (
                                <span className="text-xs text-ink-muted">
                                    {filteredPeople.length}
                                </span>
                            )}
                        </div>

                        <LetterFilter availableLetters={availableLettersByTab[activeTab]} />

                        {filteredPeople.length === 0 ? (
                            <div className="text-sm text-ink-muted italic">— нет данных —</div>
                        ) : (
                            <>
                                <PersonCardRow
                                    people={pagedPeople.map((person) => ({
                                        entityId: person.entityId,
                                        code: person.code,
                                        name: person.name,
                                        years: formatWarPersonYears(
                                            person.birthYear,
                                            person.deathYear,
                                            person.yearsLabel,
                                        ),
                                        mainPhotoPath:
                                            person.mainPhotoPath ??
                                            fallbackMap.get(person.entityId) ??
                                            null,
                                    }))}
                                />
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    searchParams={{ tab: activeTab, letter }}
                                />
                            </>
                        )}
                    </section>
                )}
            </main>
        </>
    )
}
