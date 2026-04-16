"use client"

import { useEffect, useState } from "react"
import type { TopicTreeItem } from "@/db/queries"
import { TopicTreeSelect } from "@/components/TopicTreeSelect"

type Props = {
    topics: TopicTreeItem[]
    selectedTopicIds: number[]
    resetKey?: string | number
    inputName?: string
    parentClassName?: string
    childClassName?: string
    onSelectedIdsChange?: (topicIds: number[]) => void
}

export function TopicTreePicker({
    topics,
    selectedTopicIds,
    resetKey,
    inputName = "topicIds",
    parentClassName,
    childClassName,
    onSelectedIdsChange,
}: Props) {
    const [selectedTopics, setSelectedTopics] = useState<number[]>(selectedTopicIds)

    useEffect(() => {
        setSelectedTopics(selectedTopicIds)
    }, [resetKey, selectedTopicIds])

    function handleTopicToggle(topic: TopicTreeItem, checked: boolean) {
        const next = new Set(selectedTopics)

        if (checked) {
            next.add(topic.id)
            if (topic.parentId !== null) {
                next.add(topic.parentId)
            }
        } else {
            next.delete(topic.id)

            if (topic.children.length > 0) {
                for (const child of topic.children) {
                    next.delete(child.id)
                }
            }
        }

        const nextIds = Array.from(next)
        setSelectedTopics(nextIds)
        onSelectedIdsChange?.(nextIds)
    }

    return (
        <TopicTreeSelect
            topics={topics}
            selectedIds={selectedTopics}
            inputName={inputName}
            parentClassName={parentClassName}
            childClassName={childClassName}
            onChange={handleTopicToggle}
        />
    )
}
