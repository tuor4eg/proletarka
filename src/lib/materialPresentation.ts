export function getMaterialPreviewText(
    summary: string | null,
    content: string | null,
    maxLength = 180,
) {
    const source = (summary ?? content ?? "").replace(/\s+/g, " ").trim()
    if (!source) return null
    if (source.length <= maxLength) return source
    return `${source.slice(0, maxLength).trimEnd()}...`
}

export function formatMaterialDate(date: Date) {
    return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date)
}
