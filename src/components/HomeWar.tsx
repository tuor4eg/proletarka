import Link from "next/link"
import { ChevronRight } from "lucide-react"

const links = [
    { label: "Погибшие", href: "/war" },
    { label: "Люди войны", href: "/war" },
    { label: "Хронология", href: "/war" },
]

export function HomeWar() {
    return (
        <section className="rounded-2xl bg-paper-dark border border-paper-border px-5 py-7 mb-10">
            <p className="text-xs tracking-widest text-ink-muted uppercase mb-3">Война</p>
            <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-lg font-semibold text-ink">Великая Отечественная</h2>
                <Link
                    href="/war"
                    className="text-xs text-ink-muted hover:text-ink transition-colors"
                >
                    В раздел
                </Link>
            </div>
            <p className="text-sm text-ink-secondary mb-5 leading-relaxed">
                Работники Пролетарки в годы войны — те, кто ушёл на фронт, и те, кто не вернулся.
            </p>
            <div className="flex flex-col divide-y divide-paper-border">
                {links.map(({ label, href }) => (
                    <Link
                        key={label}
                        href={href}
                        className="flex items-center justify-between py-3 text-sm text-ink-secondary hover:text-ink transition-colors"
                    >
                        {label}
                        <ChevronRight size={16} className="text-ink-muted" />
                    </Link>
                ))}
            </div>
        </section>
    )
}
