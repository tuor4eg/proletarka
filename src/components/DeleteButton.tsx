"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useFormStatus } from "react-dom"
import { Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type Props = {
    action: () => Promise<void>
    label?: string
    icon?: boolean
    disabled?: boolean
    disabledTooltip?: string
    confirmBody?: string
}

function DeleteSubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full text-sm font-medium bg-red-600 text-white rounded-xl px-4 py-2.5 hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
            {pending ? "Удаление…" : "Удалить"}
        </button>
    )
}

export function DeleteButton({
    action,
    label = "Удалить",
    icon = false,
    disabled = false,
    disabledTooltip,
    confirmBody = "Это действие нельзя отменить.",
}: Props) {
    const [open, setOpen] = useState(false)

    const triggerButton = icon ? (
        <button
            type="button"
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-400"
        >
            <Trash2 size={15} />
        </button>
    ) : (
        <button
            type="button"
            onClick={() => !disabled && setOpen(true)}
            disabled={disabled}
            className="ml-auto text-sm text-red-600 border border-red-200 rounded-xl px-4 py-2.5 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
            {label}
        </button>
    )

    return (
        <>
            {icon ? (
                <Tooltip>
                    <TooltipTrigger render={<div />}>{triggerButton}</TooltipTrigger>
                    <TooltipContent side="left">
                        {disabled && disabledTooltip ? disabledTooltip : label}
                    </TooltipContent>
                </Tooltip>
            ) : (
                triggerButton
            )}

            {open &&
                createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setOpen(false)}
                        />
                        <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
                            <h2 className="text-base font-semibold mb-2">Удалить?</h2>
                            <p className="text-sm text-gray-500 mb-6">{confirmBody}</p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="flex-1 text-sm font-medium border border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-400 transition-colors"
                                >
                                    Отмена
                                </button>
                                <form action={action} className="flex-1">
                                    <DeleteSubmitButton />
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    )
}
