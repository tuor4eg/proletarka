"use client"

import { useState, useTransition } from "react"
import { X, Plus } from "lucide-react"
import { inputClass, Field } from "@/components/MaterialForm"
import type { TopicOption } from "@/components/MaterialForm"
import { deleteEvent } from "@/app/admin/people/actions"
import type { EventInput } from "@/app/admin/people/actions"

type ExistingEvent = {
    id: number
    text: string
    yearFrom: number | null
    yearTo: number | null
    yearsLabel: string | null
    topicIds: number[]
}

type PendingEvent = EventInput & { tempId: number }

type Props = {
    entityId: number
    initialEvents: ExistingEvent[]
    topics: TopicOption[]
}

let tempIdCounter = 0

export function EventsBlock({ entityId: _entityId, initialEvents, topics }: Props) {
    const [existing, setExisting] = useState<ExistingEvent[]>(initialEvents)
    const [pending, setPending] = useState<PendingEvent[]>([])
    const [isPending, startTransition] = useTransition()

    const [text, setText] = useState("")
    const [yearFrom, setYearFrom] = useState("")
    const [yearTo, setYearTo] = useState("")
    const [yearsLabel, setYearsLabel] = useState("")
    const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([])

    function resetForm() {
        setText("")
        setYearFrom("")
        setYearTo("")
        setYearsLabel("")
        setSelectedTopicIds([])
    }

    function toggleTopic(id: number) {
        setSelectedTopicIds((prev) =>
            prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
        )
    }

    function addPending() {
        if (!text.trim()) return
        const event: PendingEvent = {
            tempId: ++tempIdCounter,
            text: text.trim(),
            yearFrom: yearFrom ? Number(yearFrom) : null,
            yearTo: yearTo ? Number(yearTo) : null,
            yearsLabel: yearsLabel.trim() || null,
            topicIds: selectedTopicIds,
        }
        setPending((prev) => [...prev, event])
        resetForm()
    }

    function removePending(tempId: number) {
        setPending((prev) => prev.filter((e) => e.tempId !== tempId))
    }

    function removeExisting(eventId: number) {
        startTransition(async () => {
            await deleteEvent(eventId)
            setExisting((prev) => prev.filter((e) => e.id !== eventId))
        })
    }

    const allEmpty = existing.length === 0 && pending.length === 0

    return (
        <div className="flex flex-col gap-3">
            {/* Скрытый input с новыми событиями для сабмита формы */}
            <input
                type="hidden"
                name="newEvents"
                value={JSON.stringify(pending.map(({ tempId: _, ...e }) => e))}
            />

            {/* Список событий */}
            {!allEmpty && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {existing.map((e) => (
                        <EventRow
                            key={e.id}
                            text={e.text}
                            yearFrom={e.yearFrom}
                            yearTo={e.yearTo}
                            yearsLabel={e.yearsLabel}
                            topicIds={e.topicIds}
                            topics={topics}
                            onRemove={() => removeExisting(e.id)}
                            disabled={isPending}
                        />
                    ))}
                    {pending.map((e) => (
                        <EventRow
                            key={e.tempId}
                            text={e.text}
                            yearFrom={e.yearFrom}
                            yearTo={e.yearTo}
                            yearsLabel={e.yearsLabel}
                            topicIds={e.topicIds}
                            topics={topics}
                            onRemove={() => removePending(e.tempId)}
                            isPending
                        />
                    ))}
                </div>
            )}

            {/* Форма добавления */}
            <div className="border border-dashed border-gray-300 rounded-xl p-3 flex flex-col gap-2.5">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Текст события"
                    rows={2}
                    className={inputClass}
                />
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={yearFrom}
                        onChange={(e) => setYearFrom(e.target.value)}
                        placeholder="Год (с)"
                        min={1800}
                        max={2100}
                        className={inputClass}
                    />
                    <input
                        type="number"
                        value={yearTo}
                        onChange={(e) => setYearTo(e.target.value)}
                        placeholder="Год (по)"
                        min={1800}
                        max={2100}
                        className={inputClass}
                    />
                </div>
                <input
                    type="text"
                    value={yearsLabel}
                    onChange={(e) => setYearsLabel(e.target.value)}
                    placeholder="Дата (если неточная, напр. «ок. 1935»)"
                    className={inputClass}
                />
                {topics.length > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-0.5">
                        {topics.map((t) => (
                            <label
                                key={t.id}
                                className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTopicIds.includes(t.id)}
                                    onChange={() => toggleTopic(t.id)}
                                    className="rounded"
                                />
                                {t.title}
                            </label>
                        ))}
                    </div>
                )}
                <button
                    type="button"
                    onClick={addPending}
                    disabled={!text.trim()}
                    className="self-start flex items-center gap-1.5 text-sm font-medium bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus size={14} />
                    Добавить событие
                </button>
            </div>
        </div>
    )
}

function EventRow({
    text,
    yearFrom,
    yearTo,
    yearsLabel,
    topicIds,
    topics,
    onRemove,
    isPending: isNew,
    disabled,
}: {
    text: string
    yearFrom: number | null
    yearTo: number | null
    yearsLabel: string | null
    topicIds: number[]
    topics: TopicOption[]
    onRemove: () => void
    isPending?: boolean
    disabled?: boolean
}) {
    const yearStr = yearsLabel
        ? yearsLabel
        : yearFrom && yearTo && yearFrom !== yearTo
          ? `${yearFrom}–${yearTo}`
          : yearFrom
            ? String(yearFrom)
            : null

    const topicTitles = topicIds
        .map((id) => topics.find((t) => t.id === id)?.title)
        .filter(Boolean) as string[]

    return (
        <div className={`flex items-start gap-2 px-4 py-2.5 ${isNew ? "bg-gray-50" : ""}`}>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                    {yearStr && <span className="text-xs text-gray-400 shrink-0">{yearStr}</span>}
                    <span className="text-sm">{text}</span>
                </div>
                {topicTitles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {topicTitles.map((title) => (
                            <span
                                key={title}
                                className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
                            >
                                {title}
                            </span>
                        ))}
                    </div>
                )}
            </div>
            <button
                type="button"
                onClick={onRemove}
                disabled={disabled}
                className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors shrink-0 disabled:opacity-30"
            >
                <X size={14} />
            </button>
        </div>
    )
}
