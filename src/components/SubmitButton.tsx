"use client"

import { useFormStatus } from "react-dom"

type Props = {
    label: string
    pendingLabel?: string
    className?: string
}

export function SubmitButton({ label, pendingLabel, className = "" }: Props) {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className={`bg-black text-white text-sm font-medium rounded-xl px-4 py-2.5 hover:bg-gray-800 disabled:opacity-60 transition-colors ${className}`}
        >
            {pending ? (pendingLabel ?? `${label}…`) : label}
        </button>
    )
}
