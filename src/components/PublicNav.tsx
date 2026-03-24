"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_LINKS = [
    { href: "/articles", label: "Статьи" },
    { href: "/people", label: "Люди" },
    { href: "/war", label: "Война" },
]

export function PublicNav({ isAdmin = false }: { isAdmin?: boolean }) {
    const pathname = usePathname()

    return (
        <nav className="border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="max-w-2xl mx-auto px-4 h-11 flex items-center gap-6">
                <Link href="/" className="text-sm font-semibold text-gray-900 shrink-0">
                    Память завода
                </Link>
                <div className="flex items-center gap-0.5 flex-1">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                                pathname.startsWith(href)
                                    ? "bg-gray-100 text-gray-900 font-medium"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
                {isAdmin && (
                    <Link
                        href="/admin"
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        Админка
                    </Link>
                )}
            </div>
        </nav>
    )
}
