const CYRILLIC_MAP: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "yo",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
}

function transliterate(text: string): string {
    return text
        .toLowerCase()
        .split("")
        .map((char) => CYRILLIC_MAP[char] ?? char)
        .join("")
}

export const CODE_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

export function generateCode(title: string): string {
    const slug = transliterate(title)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48)

    const suffix = Date.now().toString(36)

    return `${slug}-${suffix}`
}
