"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
    CircleCheckIcon,
    InfoIcon,
    TriangleAlertIcon,
    OctagonXIcon,
    Loader2Icon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            icons={{
                success: <CircleCheckIcon className="size-4" />,
                info: <InfoIcon className="size-4" />,
                warning: <TriangleAlertIcon className="size-4" />,
                error: <OctagonXIcon className="size-4" />,
                loading: <Loader2Icon className="size-4 animate-spin" />,
            }}
            style={
                {
                    "--normal-bg": "var(--color-paper)",
                    "--normal-text": "var(--color-ink)",
                    "--normal-border": "var(--color-paper-border)",
                    "--success-bg": "var(--color-paper-dark)",
                    "--success-text": "var(--color-ink)",
                    "--success-border": "var(--color-paper-border)",
                    "--error-bg": "var(--color-paper-dark)",
                    "--error-text": "var(--color-ink)",
                    "--error-border": "var(--color-paper-border)",
                    "--warning-bg": "var(--color-paper-dark)",
                    "--warning-text": "var(--color-ink)",
                    "--warning-border": "var(--color-paper-border)",
                    "--border-radius": "var(--radius-xl)",
                } as React.CSSProperties
            }
            toastOptions={{
                classNames: {
                    toast: "cn-toast",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
