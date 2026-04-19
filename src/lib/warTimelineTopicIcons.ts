import type { LucideIcon } from "lucide-react"
import { PersonStanding, Undo2, BadgeAlert } from "lucide-react"

const WAR_TIMELINE_TOPIC_ICONS: Partial<Record<string, LucideIcon>> = {
    "war-mobilization": PersonStanding,
    "war-demobilization": Undo2,
    "war-killed": BadgeAlert,
}

export function getWarTimelineTopicIcon(topicCode: string): LucideIcon | null {
    return WAR_TIMELINE_TOPIC_ICONS[topicCode] ?? null
}
