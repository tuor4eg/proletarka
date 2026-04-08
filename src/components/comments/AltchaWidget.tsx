"use client"

import { createElement, useEffect, useRef, useState } from "react"

type Props = {
    challengeUrl?: string
    name?: string
    resetKey?: number
    hidden?: boolean
}

export function AltchaWidget({
    challengeUrl = "/api/comments/challenge",
    name = "altcha",
    resetKey = 0,
    hidden = false,
}: Props) {
    const [isMounted, setIsMounted] = useState(false)
    const widgetRef = useRef<
        (HTMLElement & { reset?: () => void; getState?: () => string | undefined }) | null
    >(null)
    const hasInitializedRef = useRef(false)

    useEffect(() => {
        let isActive = true

        async function loadAltcha() {
            await import("altcha")
            await import("altcha/i18n/ru")

            if (isActive) {
                setIsMounted(true)
            }
        }

        loadAltcha()

        return () => {
            isActive = false
        }
    }, [])

    useEffect(() => {
        if (!isMounted) return

        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true
            return
        }

        widgetRef.current?.reset?.()
    }, [isMounted, resetKey])

    if (!isMounted) {
        return (
            <div
                className={`h-10 w-[220px] rounded-lg bg-white/70 ${hidden ? "hidden" : ""}`}
                aria-hidden="true"
            />
        )
    }

    return createElement("altcha-widget", {
        ref: widgetRef,
        challenge: challengeUrl,
        name,
        auto: "onsubmit",
        language: "ru",
        type: "switch",
        workers: 2,
        hidefooter: true,
        style: {
            display: hidden ? "none" : "block",
            maxWidth: "220px",
        },
    })
}
