"use client"

import { useState, useRef } from "react"

type Props = {
    fileInputName: string // имя для <input type="file"> — попадёт в FormData
    urlInputName: string // имя скрытого поля с текущим URL
    defaultUrl?: string | null
    label?: string
}

export function ImageUpload({ fileInputName, urlInputName, defaultUrl, label = "Фото" }: Props) {
    const [preview, setPreview] = useState<string | null>(null) // локальный blob-URL
    const [removed, setRemoved] = useState(false)
    const [lightbox, setLightbox] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (preview) URL.revokeObjectURL(preview)
        setPreview(URL.createObjectURL(file))
        setRemoved(false)
    }

    function handleRemove() {
        if (preview) URL.revokeObjectURL(preview)
        setPreview(null)
        setRemoved(true)
        if (inputRef.current) inputRef.current.value = ""
    }

    const displayUrl = preview ?? (!removed ? defaultUrl : null)

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">{label}</label>

            {displayUrl && (
                <div className="relative w-32 h-32">
                    <button type="button" onClick={() => setLightbox(true)} className="block w-32 h-32">
                        <img
                            src={displayUrl}
                            alt="preview"
                            className="w-32 h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                        />
                    </button>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full w-6 h-6 text-xs text-gray-500 hover:text-red-500 flex items-center justify-center"
                    >
                        ×
                    </button>
                </div>
            )}

            {lightbox && displayUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                    onClick={() => setLightbox(false)}
                >
                    <img
                        src={displayUrl}
                        alt="preview full"
                        className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        type="button"
                        onClick={() => setLightbox(false)}
                        className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full w-9 h-9 flex items-center justify-center text-lg transition-colors"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Сохраняет текущий URL, если новый файл не выбран и фото не удалено */}
            <input
                type="hidden"
                name={urlInputName}
                value={removed || preview ? "" : (defaultUrl ?? "")}
            />

            <input
                ref={inputRef}
                type="file"
                name={fileInputName}
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleChange}
                className="hidden"
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="self-start text-sm border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-400 transition-colors"
            >
                {displayUrl ? "Заменить фото" : "Загрузить фото"}
            </button>
        </div>
    )
}
