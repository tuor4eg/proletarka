"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const NAV_LINKS: { href: string; label: string; exact?: boolean }[] = [
    { href: "/admin/people", label: "Картотека" },
    { href: "/admin/topics", label: "Темы" },
]

const ARTIFACT_LINKS = [
    { href: "/admin/artifacts", label: "Все", type: "" },
    { href: "/admin/artifacts?type=stand", label: "Стенды", type: "stand" },
    { href: "/admin/artifacts?type=rarity", label: "Экспонаты", type: "rarity" },
    { href: "/admin/artifacts?type=fund", label: "Фонды", type: "fund" },
    { href: "/admin/artifacts?type=general", label: "Объекты", type: "general" },
] as const

const MATERIAL_LINKS = [
    { href: "/admin/materials", label: "Все", type: "" },
    { href: "/admin/materials?type=article", label: "Статьи", type: "article" },
    { href: "/admin/materials?type=news", label: "Новости", type: "news" },
    { href: "/admin/materials?type=photo", label: "Фото", type: "photo" },
    { href: "/admin/materials?type=document", label: "Документы", type: "document" },
] as const

const MANAGEMENT_LINKS: { href: string; label: string }[] = [
    { href: "/admin/comments", label: "Комментарии" },
    { href: "/admin/logs", label: "Журнал" },
    { href: "/admin/settings", label: "Настройки" },
]

function NewCommentsIndicator() {
    return (
        <Tooltip>
            <TooltipTrigger render={<span />}>
                <span className="inline-block size-2 rounded-full bg-red-500 shrink-0" />
            </TooltipTrigger>
            <TooltipContent>Есть новые комментарии</TooltipContent>
        </Tooltip>
    )
}

export function AdminNav({ hasPendingComments = false }: { hasPendingComments?: boolean }) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentArtifactType = searchParams.get("type") ?? ""
    const currentMaterialType = searchParams.get("type") ?? ""
    const [isManagementOpen, setIsManagementOpen] = useState(false)
    const [isArtifactsOpen, setIsArtifactsOpen] = useState(false)
    const [isMaterialsOpen, setIsMaterialsOpen] = useState(false)

    function isActive(href: string, exact?: boolean) {
        return exact ? pathname === href : pathname.startsWith(href)
    }

    const isManagementActive = MANAGEMENT_LINKS.some(({ href }) => pathname.startsWith(href))
    const isArtifactsActive =
        pathname.startsWith("/admin/artifacts") ||
        (pathname === "/admin/artifacts/new" && searchParams.has("type"))
    const isMaterialsActive =
        pathname.startsWith("/admin/materials") ||
        (pathname === "/admin/new" && searchParams.has("materialType"))

    return (
        <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 h-11 flex items-center gap-6">
                <span className="text-sm font-semibold text-gray-900 shrink-0">Админка</span>
                <div className="flex items-center gap-0.5 flex-1">
                    {NAV_LINKS.map(({ href, label, exact }) => (
                        <Link
                            key={href}
                            href={href}
                            className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                                isActive(href, exact)
                                    ? "bg-gray-100 text-gray-900 font-medium"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                    <div
                        className="relative"
                        onMouseEnter={() => setIsArtifactsOpen(true)}
                        onMouseLeave={() => setIsArtifactsOpen(false)}
                    >
                        <button
                            type="button"
                            onClick={() => setIsArtifactsOpen((open) => !open)}
                            className={`text-sm px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                                isArtifactsActive
                                    ? "bg-gray-100 text-gray-900 font-medium"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            Объекты
                            <ChevronDown
                                className={`size-4 transition-transform duration-150 ${
                                    isArtifactsOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>
                        <div
                            className={`absolute left-0 top-full pt-2 transition-all duration-150 ${
                                isArtifactsOpen
                                    ? "opacity-100 pointer-events-auto translate-y-0"
                                    : "opacity-0 pointer-events-none translate-y-1"
                            }`}
                        >
                            <div className="w-48 rounded-xl border border-gray-200 bg-white shadow-lg p-1.5">
                                {ARTIFACT_LINKS.map(({ href, label, type }) => {
                                    const active =
                                        pathname === "/admin/artifacts" &&
                                        currentArtifactType === type

                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={() => setIsArtifactsOpen(false)}
                                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                                active
                                                    ? "bg-gray-100 text-gray-900 font-medium"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                        >
                                            {label}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div
                        className="relative"
                        onMouseEnter={() => setIsMaterialsOpen(true)}
                        onMouseLeave={() => setIsMaterialsOpen(false)}
                    >
                        <button
                            type="button"
                            onClick={() => setIsMaterialsOpen((open) => !open)}
                            className={`text-sm px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                                isMaterialsActive
                                    ? "bg-gray-100 text-gray-900 font-medium"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            Материалы
                            <ChevronDown
                                className={`size-4 transition-transform duration-150 ${
                                    isMaterialsOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>
                        <div
                            className={`absolute left-0 top-full pt-2 transition-all duration-150 ${
                                isMaterialsOpen
                                    ? "opacity-100 pointer-events-auto translate-y-0"
                                    : "opacity-0 pointer-events-none translate-y-1"
                            }`}
                        >
                            <div className="w-48 rounded-xl border border-gray-200 bg-white shadow-lg p-1.5">
                                {MATERIAL_LINKS.map(({ href, label, type }) => {
                                    const active =
                                        pathname === "/admin/materials" &&
                                        currentMaterialType === type

                                    return (
                                        <Link
                                            key={href}
                                            href={href}
                                            onClick={() => setIsMaterialsOpen(false)}
                                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                                active
                                                    ? "bg-gray-100 text-gray-900 font-medium"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            }`}
                                        >
                                            {label}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div
                        className="relative group"
                        onMouseEnter={() => setIsManagementOpen(true)}
                        onMouseLeave={() => setIsManagementOpen(false)}
                    >
                        <button
                            type="button"
                            onClick={() => setIsManagementOpen((open) => !open)}
                            className={`text-sm px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                                isManagementActive
                                    ? "bg-gray-100 text-gray-900 font-medium"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            Инструменты
                            {hasPendingComments ? <NewCommentsIndicator /> : null}
                            <ChevronDown
                                className={`size-4 transition-transform duration-150 ${
                                    isManagementOpen ? "rotate-180" : ""
                                }`}
                            />
                        </button>
                        <div
                            className={`absolute right-0 top-full pt-2 transition-all duration-150 ${
                                isManagementOpen
                                    ? "opacity-100 pointer-events-auto translate-y-0"
                                    : "opacity-0 pointer-events-none translate-y-1"
                            }`}
                        >
                            <div className="w-48 rounded-xl border border-gray-200 bg-white shadow-lg p-1.5">
                                {MANAGEMENT_LINKS.map(({ href, label }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setIsManagementOpen(false)}
                                        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                            pathname.startsWith(href)
                                                ? "bg-gray-100 text-gray-900 font-medium"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                    >
                                        <span>{label}</span>
                                        {href === "/admin/comments" && hasPendingComments ? (
                                            <NewCommentsIndicator />
                                        ) : null}
                                    </Link>
                                ))}
                                <div className="my-1 h-px bg-gray-100" />
                                <form action="/admin/logout" method="POST">
                                    <button
                                        type="submit"
                                        onClick={() => setIsManagementOpen(false)}
                                        className="block w-full text-left rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                    >
                                        Выйти
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/"
                        className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        ← Сайт
                    </Link>
                </div>
            </div>
        </nav>
    )
}
