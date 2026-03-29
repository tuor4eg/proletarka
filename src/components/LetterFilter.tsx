"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Suspense } from "react"

const ALPHABET = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ".split("")

type Props = {
    availableLetters: string[]
    compact?: boolean
}

function LetterFilterInner({ availableLetters, compact }: Props) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const currentLetter = searchParams.get("letter") ?? ""

    function navigate(letter: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (letter) params.set("letter", letter)
        else params.delete("letter")
        router.push(`${pathname}?${params}`)
    }

    const available = new Set(availableLetters)

    if (compact) {
        return (
            <div className="flex flex-wrap gap-0.5 mb-4">
                {currentLetter && (
                    <button
                        onClick={() => navigate("")}
                        className="px-2 py-0.5 text-xs rounded text-ink-muted hover:text-ink underline underline-offset-2 mr-1"
                    >
                        Все
                    </button>
                )}
                {ALPHABET.map((letter) => {
                    const isAvailable = available.has(letter)
                    const isActive = currentLetter === letter
                    return isAvailable ? (
                        <button
                            key={letter}
                            onClick={() => navigate(letter)}
                            className={`w-6 h-6 text-xs rounded transition-colors ${
                                isActive
                                    ? "bg-ink text-white"
                                    : "text-ink-secondary hover:bg-paper-dark"
                            }`}
                        >
                            {letter}
                        </button>
                    ) : (
                        <span
                            key={letter}
                            className="w-6 h-6 text-xs flex items-center justify-center text-ink-muted"
                        >
                            {letter}
                        </span>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="flex flex-wrap gap-1 mb-6">
            {currentLetter && (
                <button
                    onClick={() => navigate("")}
                    className="px-2.5 py-1 text-sm rounded-lg text-ink-muted hover:text-ink underline underline-offset-2 mr-1"
                >
                    Все
                </button>
            )}
            {ALPHABET.map((letter) => {
                const isAvailable = available.has(letter)
                const isActive = currentLetter === letter
                return isAvailable ? (
                    <button
                        key={letter}
                        onClick={() => navigate(letter)}
                        className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${
                            isActive ? "bg-ink text-white" : "text-ink-secondary hover:bg-paper-dark"
                        }`}
                    >
                        {letter}
                    </button>
                ) : (
                    <span
                        key={letter}
                        className="w-8 h-8 text-sm flex items-center justify-center text-ink-muted"
                    >
                        {letter}
                    </span>
                )
            })}
        </div>
    )
}

export function LetterFilter(props: Props) {
    return (
        <Suspense>
            <LetterFilterInner {...props} />
        </Suspense>
    )
}
