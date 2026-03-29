import { HomePeople } from "@/components/HomePeople"

export function HomeFunds() {
    return (
        <section className="border-t border-paper-border pt-8 mb-10">
            <div className="flex items-baseline justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-widest uppercase text-ink">Фонды</h2>
            </div>
            <HomePeople />
        </section>
    )
}
