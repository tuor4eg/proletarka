"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
    const router = useRouter()
    return (
        <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
            <ArrowLeft size={15} />
            Назад
        </button>
    )
}
