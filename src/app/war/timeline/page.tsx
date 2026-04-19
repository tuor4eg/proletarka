export const dynamic = "force-dynamic"

import { PageHero } from "@/components/PageHero"
import { BackButton } from "@/components/BackButton"
import { WarTimeline } from "@/components/WarTimeline"
import { getWarPeopleBuckets } from "@/lib/warPeople"
import { getWarTimeline } from "@/lib/warTimeline"

export default async function WarTimelinePage() {
    const { warTopic } = await getWarPeopleBuckets()

    if (!warTopic) {
        return (
            <>
                <PageHero title="Военная хронология" />
                <main className="max-w-2xl mx-auto px-4 py-8">
                    <div className="mb-6">
                        <BackButton href="/war" />
                    </div>
                    <p className="text-sm text-ink-muted">Раздел в разработке.</p>
                </main>
            </>
        )
    }

    const timelineEvents = await getWarTimeline(warTopic.id)

    return (
        <>
            <PageHero title="Военная хронология" />
            <main className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <BackButton href="/war" />
                </div>

                <section className="border-t border-paper-border pt-8 mb-10">
                    <div className="max-w-xl mb-6">
                        <p className="text-sm text-ink-muted leading-relaxed">
                            Лента военных лет и послевоенного времени: фронт, мобилизация,
                            возвращение домой, потери и события, связанные с работниками Пролетарки.
                        </p>
                    </div>

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
            </main>
        </>
    )
}
