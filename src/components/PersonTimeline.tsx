"use client"

import { useState } from "react"

type TimelineEvent = {
    id: number
    text: string
    yearFrom: number | null
    yearTo: number | null
    yearsLabel: string | null
    topicTitles: string[]
}

function yearStr(e: TimelineEvent): string | null {
    if (e.yearsLabel) return e.yearsLabel
    if (e.yearFrom && e.yearTo && e.yearFrom !== e.yearTo) return `${e.yearFrom}–${e.yearTo}`
    if (e.yearFrom) return String(e.yearFrom)
    return null
}

function EventItem({ e }: { e: TimelineEvent }) {
    const year = yearStr(e)
    return (
        <div className="relative py-2.5">
            <div className="absolute -left-[21px] top-[18px] w-2.5 h-2.5 rounded-full bg-paper-border border-2 border-paper" />
            <div className="flex flex-col gap-0.5">
                {year && <span className="text-xs text-ink-muted">{year}</span>}
                <span className="text-sm text-ink">{e.text}</span>
                {e.topicTitles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                        {e.topicTitles.map((title) => (
                            <span
                                key={title}
                                className="text-xs bg-paper-dark text-ink-muted px-1.5 py-0.5 rounded"
                            >
                                {title}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export function PersonTimeline({ events }: { events: TimelineEvent[] }) {
    const [expanded, setExpanded] = useState(false)

    if (events.length === 0) return null

    const needsCollapse = events.length > 3
    const first = events.slice(0, 2)
    const middle = events.slice(2, -1)
    const last = events[events.length - 1]

    return (
        <div className="mb-8">
            <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-3">
                Хронология
            </h2>
            <div className="flex flex-col gap-0 border-l-2 border-paper-border pl-4">
                {needsCollapse ? (
                    <>
                        {first.map((e) => (
                            <EventItem key={e.id} e={e} />
                        ))}

                        {expanded ? (
                            <>
                                {middle.map((e) => (
                                    <EventItem key={e.id} e={e} />
                                ))}
                                <div className="relative py-2">
                                    <div className="absolute -left-[21px] top-[14px] w-2.5 h-2.5 rounded-full bg-paper-dark border-2 border-paper" />
                                    <button
                                        onClick={() => setExpanded(false)}
                                        className="text-xs text-ink-muted hover:text-ink-secondary transition-colors ml-1"
                                    >
                                        Свернуть
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="relative py-2">
                                <div className="absolute -left-[21px] top-[14px] flex flex-col gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-paper-dark border-2 border-paper" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-paper-dark border-2 border-paper" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-paper-dark border-2 border-paper" />
                                </div>
                                <button
                                    onClick={() => setExpanded(true)}
                                    className="text-xs text-ink-muted hover:text-ink-secondary transition-colors ml-1"
                                >
                                    Ещё {middle.length}{" "}
                                    {plural(middle.length, "событие", "события", "событий")}
                                </button>
                            </div>
                        )}

                        <EventItem e={last} />
                    </>
                ) : (
                    events.map((e) => <EventItem key={e.id} e={e} />)
                )}
            </div>
        </div>
    )
}

function plural(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
    return many
}
