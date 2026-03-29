import Link from "next/link"

type MaterialCardProps = {
    id: number
    title: string
    summary: string | null
    yearFrom: number | null
    yearTo: number | null
    personName: string | null
    topics: string[]
}

type Props = {
    material: MaterialCardProps
}

export function MaterialCard({ material }: Props) {
    const { id, title, summary, yearFrom, yearTo, personName, topics } = material

    const yearLabel = yearFrom && yearTo ? `${yearFrom}–${yearTo}` : yearFrom ? `${yearFrom}` : null

    const hasMeta = personName || topics.length > 0 || yearLabel

    return (
        <Link href={`/materials/${id}`}>
            <div className="rounded-2xl border border-paper-border p-4 flex flex-col gap-2 hover:border-ink-muted transition-colors">
                {hasMeta && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {personName && (
                            <span className="text-xs bg-paper-dark text-ink-secondary rounded-full px-2.5 py-0.5">
                                {personName}
                            </span>
                        )}
                        {topics.map((t) => (
                            <span
                                key={t}
                                className="text-xs bg-paper-dark text-ink-secondary rounded-full px-2.5 py-0.5"
                            >
                                {t}
                            </span>
                        ))}
                        {yearLabel && <span className="text-xs text-ink-muted">{yearLabel}</span>}
                    </div>
                )}
                <h2 className="text-base font-semibold leading-snug">{title}</h2>
                {summary && <p className="text-sm text-ink-secondary leading-relaxed">{summary}</p>}
            </div>
        </Link>
    )
}
