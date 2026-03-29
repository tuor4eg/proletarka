"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function NavigationProgress() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Hide when navigation completes
    useEffect(() => {
        setVisible(false)
    }, [pathname, searchParams])

    useEffect(() => {
        // Show on link clicks
        function handleClick(e: MouseEvent) {
            const target = (e.target as HTMLElement).closest("a")
            if (!target) return
            const href = target.getAttribute("href")
            if (!href || href.startsWith("#") || href.startsWith("http")) return
            timerRef.current = setTimeout(() => setVisible(true), 100)
        }

        // Show on programmatic navigation (router.push)
        function handleNavigationStart() {
            if (timerRef.current) clearTimeout(timerRef.current)
            setVisible(true)
        }

        document.addEventListener("click", handleClick)
        window.addEventListener("navigation-start", handleNavigationStart)
        return () => {
            document.removeEventListener("click", handleClick)
            window.removeEventListener("navigation-start", handleNavigationStart)
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    if (!visible) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-paper-dark">
            <div className="h-full bg-ink animate-progress" />
        </div>
    )
}

export function triggerNavigationStart() {
    window.dispatchEvent(new Event("navigation-start"))
}
