"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

type Props = {
    src: string
    alt: string
}

export function CoverImage({ src, alt }: Props) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!open) return
        document.body.style.overflow = "hidden"
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }
        window.addEventListener("keydown", onKey)
        return () => {
            document.body.style.overflow = ""
            window.removeEventListener("keydown", onKey)
        }
    }, [open])

    return (
        <>
            <img
                src={src}
                alt={alt}
                onClick={() => setOpen(true)}
                className="w-full rounded-xl mb-4 object-cover max-h-80 cursor-zoom-in"
            />
            {open &&
                createPortal(
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    >
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={src}
                            alt={alt}
                            onClick={(e) => e.stopPropagation()}
                            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                        />
                    </div>,
                    document.body,
                )}
        </>
    )
}
