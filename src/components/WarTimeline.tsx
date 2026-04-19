"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { getWarTimelineTopicIcon } from "@/lib/warTimelineTopicIcons"

export type WarTimelinePerson = {
    name: string
    code: string
}

export type WarTimelineEvent = {
    kind: "event"
    id: number
    topicCode: string
    text: string
    yearFrom: number | null
    yearTo: number | null
    yearsLabel: string | null
    entityId: number
    personName: string
    personCode: string
}

export type WarTimelineGroupedEvent = {
    kind: "group"
    id: string
    topicCode: "war-mobilization" | "war-demobilization" | "war-killed"
    label: string
    yearFrom: number | null
    people: WarTimelinePerson[]
}

export type WarTimelineItem = WarTimelineEvent | WarTimelineGroupedEvent

type YearGroup = {
    year: number | null
    events: WarTimelineItem[]
}

function isWartimeYear(year: number | null) {
    return year !== null && year >= 1941 && year <= 1945
}

function groupByYear(events: WarTimelineItem[]): YearGroup[] {
    const map = new Map<number | null, WarTimelineItem[]>()
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
const GROUP_PREVIEW_COUNT = 3

export function WarTimeline({ events }: { events: WarTimelineItem[] }) {
    const [expanded, setExpanded] = useState(false)
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
    const [overlayTop, setOverlayTop] = useState<number>(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const visible = expanded ? events : events.slice(0, INITIAL_COUNT)
    const hidden = events.length - INITIAL_COUNT
    const groups = groupByYear(visible)
    const selectedGroup =
        visible.find(
            (event): event is WarTimelineGroupedEvent =>
                event.kind === "group" && event.id === selectedGroupId,
        ) ?? null

    function openGroupCard(groupId: string, trigger: HTMLButtonElement) {
        const row = trigger.closest("[data-timeline-row]")
        const container = containerRef.current

        if (row && container) {
            const rowRect = (row as HTMLElement).getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()
            setOverlayTop(Math.max(8, rowRect.top - containerRect.top - 6))
        }

        setSelectedGroupId(groupId)
    }

    return (
        <div
            ref={containerRef}
            className="relative flex flex-col border-l-2 border-paper-border pl-4"
        >
            {selectedGroup && (
                <div
                    className="absolute left-6 right-2 z-20 rounded-2xl border border-paper-border bg-paper p-4 shadow-lg md:left-10"
                    style={{ top: overlayTop }}
                >
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-start gap-2.5">
                            {(() => {
                                const Icon = getWarTimelineTopicIcon(selectedGroup.topicCode)
                                return Icon ? (
                                    <span className="mt-0.5 shrink-0 text-ink-muted">
                                        <Icon size={16} />
                                    </span>
                                ) : null
                            })()}
                            <div>
                                <p className="text-sm font-semibold text-ink">
                                    {selectedGroup.label}
                                </p>
                                <p className="text-xs text-ink-muted mt-1">
                                    {selectedGroup.yearFrom ?? "Без даты"} •{" "}
                                    {selectedGroup.people.length}{" "}
                                    {plural(
                                        selectedGroup.people.length,
                                        "человек",
                                        "человека",
                                        "человек",
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedGroupId(null)}
                            className="shrink-0 rounded-full p-1 text-ink-muted hover:text-ink-secondary transition-colors"
                            aria-label="Закрыть карточку"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-x-1.5 gap-y-1 text-sm text-ink-secondary">
                        {selectedGroup.people.map((person, index) => (
                            <span key={person.code}>
                                <Link
                                    href={`/people/${person.code}`}
                                    className="hover:text-ink transition-colors"
                                >
                                    {person.name}
                                </Link>
                                {index < selectedGroup.people.length - 1 ? "," : ""}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {groups.map((group) => (
                <div key={group.year ?? "undated"}>
                    <div className="relative py-1">
                        <div
                            className={`absolute -left-[21px] top-[10px] w-2.5 h-2.5 rounded-full border-2 border-paper ${
                                isWartimeYear(group.year) ? "bg-ink-muted" : "bg-paper-border"
                            }`}
                        />
                        <span
                            className={`text-xs font-semibold uppercase tracking-wide ${
                                isWartimeYear(group.year)
                                    ? "text-ink bg-paper-dark border border-paper-border px-2 py-0.5 rounded-full"
                                    : "text-ink-muted"
                            }`}
                        >
                            {group.year ?? "Без даты"}
                        </span>
                    </div>
                    {group.events.map((e) => (
                        <div key={e.id} data-timeline-row className="relative py-2 pl-3">
                            <div className="absolute -left-[17px] top-[14px] w-1.5 h-1.5 rounded-full bg-paper-border border-2 border-paper" />
                            {e.kind === "group" ? (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-start gap-2">
                                        {(() => {
                                            const Icon = getWarTimelineTopicIcon(e.topicCode)
                                            return Icon ? (
                                                <span className="mt-0.5 shrink-0 text-ink-muted">
                                                    <Icon size={15} />
                                                </span>
                                            ) : null
                                        })()}
                                        <span className="text-sm text-ink">
                                            {e.label} — {e.people.length}{" "}
                                            {plural(
                                                e.people.length,
                                                "человек",
                                                "человека",
                                                "человек",
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-1 gap-y-0.5 text-xs text-ink-muted">
                                        {e.people
                                            .slice(0, GROUP_PREVIEW_COUNT)
                                            .map((person, index) => (
                                                <span key={person.code}>
                                                    <Link
                                                        href={`/people/${person.code}`}
                                                        className="hover:text-ink-secondary transition-colors"
                                                    >
                                                        {person.name}
                                                    </Link>
                                                    {index <
                                                    Math.min(e.people.length, GROUP_PREVIEW_COUNT) -
                                                        1
                                                        ? ","
                                                        : ""}
                                                </span>
                                            ))}
                                        {e.people.length > GROUP_PREVIEW_COUNT && <span>…</span>}
                                    </div>
                                    {e.people.length > GROUP_PREVIEW_COUNT && (
                                        <div>
                                            <button
                                                type="button"
                                                onClick={(event) =>
                                                    openGroupCard(e.id, event.currentTarget)
                                                }
                                                className="text-xs text-ink-muted hover:text-ink-secondary transition-colors"
                                            >
                                                Показать всех
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm text-ink">{e.text}</span>
                                    <Link
                                        href={`/people/${e.personCode}`}
                                        className="text-xs text-ink-muted hover:text-ink-secondary transition-colors w-fit"
                                    >
                                        {e.personName}
                                    </Link>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}

            {events.length > INITIAL_COUNT && (
                <div className="relative py-2">
                    {!expanded && (
                        <div className="absolute -left-[21px] top-[14px] flex flex-col gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-paper-dark border-2 border-paper" />
                            <div className="w-2.5 h-2.5 rounded-full bg-paper-dark border-2 border-paper" />
                            <div className="w-2.5 h-2.5 rounded-full bg-paper-dark border-2 border-paper" />
                        </div>
                    )}
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="text-xs text-ink-muted hover:text-ink-secondary transition-colors ml-1"
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
