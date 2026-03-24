import Link from "next/link"

type Topic = {
    code: string
    title: string
}

type Props = {
    topics: Topic[]
    activeTopics: string[]
}

function buildHref(activeTopics: string[], code: string): string {
    const next = activeTopics.includes(code)
        ? activeTopics.filter((c) => c !== code)
        : [...activeTopics, code]
    return next.length > 0 ? `/?topic=${next.join(",")}` : "/"
}

export function FilterBar({ topics, activeTopics }: Props) {
    if (topics.length === 0) return null

    return (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {topics.map((topic) => {
                const isActive = activeTopics.includes(topic.code)
                return (
                    <Link
                        key={topic.code}
                        href={buildHref(activeTopics, topic.code)}
                        className={`shrink-0 text-xs rounded-full px-3 py-1.5 transition-colors ${
                            isActive
                                ? "bg-black text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        {topic.title}
                    </Link>
                )
            })}
        </div>
    )
}
