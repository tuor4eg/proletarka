import Link from "next/link"
import { getSession } from "@/lib/session"

type Props = {
    title: string
}

export async function PageHero({ title }: Props) {
    const session = await getSession()

    return (
        <div
            className="relative w-full overflow-hidden"
            style={{ height: "clamp(140px, 25vw, 240px)" }}
        >
            <img src="/proletarka.jpg" alt="Пролетарка" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div
                className="absolute bottom-0 left-0 right-0 h-10"
                style={{ background: "linear-gradient(to bottom, transparent, #F7F4EE)" }}
            />
            <div className="absolute top-0 left-0 right-0 px-5 pt-4 flex items-center justify-between">
                <Link
                    href="/"
                    className="bg-black/40 hover:bg-black/60 transition-colors px-3 py-1.5 rounded-lg backdrop-blur-sm"
                >
                    <img
                        src="/logo.png"
                        alt="Память завода"
                        className="h-16 w-auto brightness-0 invert"
                    />
                </Link>
                {session && (
                    <Link
                        href="/admin"
                        className="text-sm font-semibold text-white bg-black/40 hover:bg-black/60 transition-colors px-3 py-1.5 rounded-lg backdrop-blur-sm"
                    >
                        Админка
                    </Link>
                )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
                <h1 className="text-2xl font-bold tracking-widest uppercase text-white leading-tight">
                    {title}
                </h1>
            </div>
        </div>
    )
}
