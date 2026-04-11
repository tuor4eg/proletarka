"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton({ href }: { href?: string }) {
    const router = useRouter()
    const className =
        "flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink-secondary transition-colors"

    return href ? (
        <Link href={href} className={className}>
            <ArrowLeft size={15} />
            Назад
        </Link>
    ) : (
        <button onClick={() => router.back()} className={className}>
            <ArrowLeft size={15} />
            Назад
        </button>
    )
}
