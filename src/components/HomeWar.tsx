import Link from "next/link"
import { getWarPeopleBuckets } from "@/lib/warPeople"
import { warPeopleTabs } from "@/lib/warSections"

export async function HomeWar() {
    const { warTopic, counts } = await getWarPeopleBuckets()
    const visibleTabs = warPeopleTabs.filter((item) => item.key !== "former-workers-survived")

    if (!warTopic) return null

    return (
        <section className="pt-8 mb-10 border-b border-paper-border pb-8">
            <div className="rounded-[1.75rem] border border-paper-border bg-gradient-to-br from-paper via-white to-paper-dark/80 p-5 md:p-6">
                <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-start">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted mb-3">
                            Специальный раздел
                        </p>
                        <h2 className="text-2xl font-bold tracking-widest uppercase text-ink">
                            Война
                        </h2>
                        <p className="mt-3 text-sm leading-relaxed text-ink-secondary max-w-md">
                            Истории работников Пролетарки в годы Великой Отечественной войны: фронт,
                            завод, потери и возвращение.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                href="/war"
                                className="inline-flex items-center rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink-secondary transition-colors"
                            >
                                Открыть раздел
                            </Link>
                            <Link
                                href="/war/people"
                                className="inline-flex items-center rounded-xl border border-paper-border px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper-dark transition-colors"
                            >
                                Смотреть участников
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {visibleTabs.map((item) => (
                            <Link
                                key={item.key}
                                href={`/war/people?tab=${item.key}`}
                                className="group rounded-2xl border border-paper-border bg-white/70 px-4 py-4 hover:bg-white transition-colors"
                            >
                                <div className="text-3xl font-semibold leading-none tracking-[-0.06em] text-ink">
                                    {counts[item.key]}
                                </div>
                                <p className="mt-2 text-xs leading-snug text-ink-secondary">
                                    {item.label}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
