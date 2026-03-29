import Link from "next/link"
import { getSession } from "@/lib/session"

export async function HomeHero() {
    const session = await getSession()

    return (
        <div className="relative w-full overflow-hidden" style={{ maxHeight: "clamp(280px, 45vw, 520px)" }}>
            <img
                src="/proletarka.jpg"
                alt="Пролетарка"
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: "linear-gradient(to bottom, transparent, #F7F4EE)" }} />
            <div className="absolute top-0 left-0 right-0 px-5 pt-4 flex items-center justify-between lg:px-12">
                <Link href="/" className="bg-black/40 hover:bg-black/60 transition-colors px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <img src="/logo.png" alt="Память завода" className="h-16 w-auto brightness-0 invert" />
                </Link>
                {session && (
                    <Link href="/admin" className="text-sm font-semibold text-white bg-black/40 hover:bg-black/60 transition-colors px-3 py-1.5 rounded-lg backdrop-blur-sm">
                        Админка
                    </Link>
                )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 lg:px-12 lg:pb-10 max-w-2xl lg:max-w-4xl">
                <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
                    Память Пролетарки
                </h1>
                <p className="text-sm lg:text-base text-white/80 mt-2 leading-relaxed">
                    История завода и его работников.
                </p>
            </div>
        </div>
    )
}
