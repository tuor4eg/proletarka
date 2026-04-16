"use client"

import type { TopicTreeItem } from "@/db/queries"

export type TopicTreeOption = TopicTreeItem

type Props = {
    topics: TopicTreeOption[]
    selectedIds: number[]
    inputName?: string
    parentClassName?: string
    childClassName?: string
    emptyMessage?: string
    onChange: (topic: TopicTreeOption, checked: boolean) => void
}

export function TopicTreeSelect({
    topics,
    selectedIds,
    inputName = "topicIds",
    parentClassName = "flex items-center gap-2 text-sm text-gray-700 cursor-pointer",
    childClassName = "flex items-center gap-2 text-sm text-gray-600 cursor-pointer",
    emptyMessage,
    onChange,
}: Props) {
    if (topics.length === 0) {
        return emptyMessage ? <p className="text-sm text-gray-400">{emptyMessage}</p> : null
    }

    return (
        <div className="flex flex-col gap-2 pt-0.5">
            {topics.map((topic) => {
                const parentChecked = selectedIds.includes(topic.id)

                return (
                    <div key={topic.id} className="flex flex-col gap-1.5">
                        <label className={parentClassName}>
                            <input
                                type="checkbox"
                                name={inputName}
                                value={topic.id}
                                checked={parentChecked}
                                onChange={(e) => onChange(topic, e.target.checked)}
                                className="rounded"
                            />
                            {topic.title}
                        </label>

                        {parentChecked && topic.children.length > 0 && (
                            <div className="ml-5 flex flex-col gap-1.5 border-l border-gray-200 pl-3">
                                {topic.children.map((child) => (
                                    <label key={child.id} className={childClassName}>
                                        <input
                                            type="checkbox"
                                            name={inputName}
                                            value={child.id}
                                            checked={selectedIds.includes(child.id)}
                                            onChange={(e) => onChange(child, e.target.checked)}
                                            className="rounded"
                                        />
                                        {child.title}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
