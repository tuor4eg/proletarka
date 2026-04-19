export const dynamic = "force-dynamic"

import { PageHero } from "@/components/PageHero"
import { BackButton } from "@/components/BackButton"
import { PersonCardRow } from "@/components/PersonCardRow"
import { LetterFilter } from "@/components/LetterFilter"
import { Pagination } from "@/components/Pagination"
import {
    formatWarPersonYears,
    getWarTopicPeople,
    WAR_HOME_FRONT_WORKERS_TOPIC_CODE,
} from "@/lib/warPeople"

type Props = {
    searchParams: Promise<{ letter?: string; page?: string }>
}

const PAGE_SIZE = 20

export default async function WarHomeFrontWorkersPage({ searchParams }: Props) {
    const { letter, page: pageParam } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)

    const { topic, people, availableLetters, fallbackMap } = await getWarTopicPeople(
        WAR_HOME_FRONT_WORKERS_TOPIC_CODE,
    )

    const filteredPeople = letter
        ? people.filter((person) => person.name.toUpperCase().startsWith(letter.toUpperCase()))
        : people
    const totalPages = Math.ceil(filteredPeople.length / PAGE_SIZE)
    const pagedPeople = filteredPeople.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <>
            <PageHero title="Труженики тыла" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <BackButton href="/war" />
                </div>

                {!topic ? (
                    <p className="text-sm text-ink-muted">Раздел в разработке.</p>
                ) : (
                    <section>
                        <div className="flex items-baseline justify-between gap-3 mb-4">
                            <h2 className="text-lg font-semibold text-ink">Труженики тыла</h2>
                            {filteredPeople.length > 0 && (
                                <span className="text-xs text-ink-muted tabular-nums">
                                    {filteredPeople.length}
                                </span>
                            )}
                        </div>

                        <LetterFilter availableLetters={availableLetters} />

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
                                    searchParams={{ letter }}
                                />
                            </>
                        )}
                    </section>
                )}
            </main>
        </>
    )
}
