"use client"

import { useState } from "react"

const tabClass = (active: boolean) =>
    `text-sm px-3 py-1.5 rounded-lg transition-colors ${
        active
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
    }`

type Props = {
    main: React.ReactNode
    sources: React.ReactNode
    events: React.ReactNode
}

export function EditPersonFormTabs({ main, sources, events }: Props) {
    const [activeTab, setActiveTab] = useState<"main" | "sources" | "events">("main")

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-0.5 border-b border-gray-100 pb-3">
                <button
                    type="button"
                    onClick={() => setActiveTab("main")}
                    className={tabClass(activeTab === "main")}
                >
                    Основное
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("sources")}
                    className={tabClass(activeTab === "sources")}
                >
                    Источники
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("events")}
                    className={tabClass(activeTab === "events")}
                >
                    События
                </button>
            </div>

            <div className={activeTab === "main" ? "flex flex-col gap-4" : "hidden"}>{main}</div>
            <div className={activeTab === "sources" ? "block" : "hidden"}>{sources}</div>
            <div className={activeTab === "events" ? "block" : "hidden"}>{events}</div>
        </div>
    )
}
