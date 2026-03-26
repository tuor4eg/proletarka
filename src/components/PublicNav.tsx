"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_LINKS = [
    { href: "/people", label: "Люди" },
    { href: "/war", label: "Война" },
]

export function PublicNav({ isAdmin = false }: { isAdmin?: boolean }) {
    const pathname = usePathname()

    return (
        <nav className="border-b border-paper-border bg-paper sticky top-0 z-10">
            <div className="max-w-2xl mx-auto px-4 h-11 flex items-center gap-6">
                <Link href="/" className="text-sm font-semibold text-ink shrink-0">
                    Память завода
                </Link>
                <div className="flex items-center gap-0.5 flex-1">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                                pathname.startsWith(href)
                                    ? "bg-paper-dark text-ink font-medium"
                                    : "text-ink-secondary hover:text-ink hover:bg-paper-dark"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
                {isAdmin && (
                    <Link
                        href="/admin"
                        className="text-sm text-ink-muted hover:text-ink transition-colors"
                    >
                        Админка
                    </Link>
                )}
            </div>
        </nav>
    )
}
