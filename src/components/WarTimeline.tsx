"use client"

import { useState } from "react"
import Link from "next/link"

export type WarTimelineEvent = {
    id: number
    text: string
    yearFrom: number | null
    yearTo: number | null
    yearsLabel: string | null
    entityId: number
    personName: string
    personEntityId: number
}

type YearGroup = {
    year: number | null
    events: WarTimelineEvent[]
}

function groupByYear(events: WarTimelineEvent[]): YearGroup[] {
    const map = new Map<number | null, WarTimelineEvent[]>()
    for (const e of events) {
        const key = e.yearFrom ?? null
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(e)
    }
    const dated = Array.from(map.entries())
        .filter(([year]) => year !== null)
        .sort(([a], [b]) => (a as number) - (b as number))
        .map(([year, events]) => ({ year, events }))
    const undated = map.has(null) ? [{ year: null, events: map.get(null)! }] : []
    return [...dated, ...undated]
}

function plural(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
    return many
}

const INITIAL_COUNT = 10

export function WarTimeline({ events }: { events: WarTimelineEvent[] }) {
    const [expanded, setExpanded] = useState(false)

    const visible = expanded ? events : events.slice(0, INITIAL_COUNT)
    const hidden = events.length - INITIAL_COUNT
    const groups = groupByYear(visible)

    return (
        <div className="flex flex-col border-l-2 border-gray-100 pl-4">
            {groups.map((group) => (
                <div key={group.year ?? "undated"}>
                    <div className="relative py-1">
                        <div className="absolute -left-[21px] top-[10px] w-2.5 h-2.5 rounded-full bg-gray-400 border-2 border-white" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            {group.year ?? "Без даты"}
                        </span>
                    </div>
                    {group.events.map((e) => (
                        <div key={e.id} className="relative py-2 pl-3">
                            <div className="absolute -left-[17px] top-[14px] w-1.5 h-1.5 rounded-full bg-gray-200 border-2 border-white" />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm text-gray-800">{e.text}</span>
                                <Link
                                    href={`/people/${e.personEntityId}`}
                                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors w-fit"
                                >
                                    {e.personName}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {events.length > INITIAL_COUNT && (
                <div className="relative py-2">
                    {!expanded && (
                        <div className="absolute -left-[21px] top-[14px] flex flex-col gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-100 border-2 border-white" />
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-100 border-2 border-white" />
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-100 border-2 border-white" />
                        </div>
                    )}
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors ml-1"
                    >
                        {expanded
                            ? "Свернуть"
                            : `Ещё ${hidden} ${plural(hidden, "событие", "события", "событий")}`}
                    </button>
                </div>
            )}
        </div>
    )
}
