import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import { NavigationProgress } from "@/components/NavigationProgress"
import { YandexMetrika } from "@/components/YandexMetrika"
import { Geist } from "next/font/google"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
    title: "Музей завода «Пролетарская Свобода»",
    description: "Люди, события и находки из истории завода",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="ru" className={cn("font-sans", geist.variable)}>
            <body>
                <div className="fixed inset-0 [z-index:-10]">
                    <img
                        src="/bckg_main.jpg"
                        alt=""
                        className="w-full h-full object-cover opacity-20"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#1C1917] to-transparent" />
                </div>
                <div className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-4xl bg-paper [z-index:-1]" />
                <Suspense>
                    <NavigationProgress />
                </Suspense>
                {children}
                <Toaster position="bottom-center" richColors />
                <YandexMetrika />
            </body>
        </html>
    )
}
