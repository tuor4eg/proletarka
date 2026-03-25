"use client"

import { useState } from "react"
import { inputClass } from "@/components/MaterialForm"

export function CodeField({ code }: { code?: string }) {
    const [enabled, setEnabled] = useState(false)

    if (code !== undefined) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="uppercase tracking-wide">code:</span>
                <span className="font-mono">{code}</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="rounded"
                />
                Задать code вручную
            </label>
            {enabled && (
                <div className="flex flex-col gap-1">
                    <input
                        name="customCode"
                        type="text"
                        required
                        pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
                        placeholder="primer-code-123"
                        className={inputClass}
                    />
                    <p className="text-xs text-gray-400">
                        Только строчные латинские буквы, цифры и дефисы. Нельзя изменить после создания.
                    </p>
                </div>
            )}
        </div>
    )
}
