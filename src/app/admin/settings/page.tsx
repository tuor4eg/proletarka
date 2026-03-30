import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/db"
import { users, artifacts, showcases } from "@/db/schema"
import { getSession } from "@/lib/session"
import { inputClass, Field } from "@/components/MaterialForm"
import { updateProfile, updatePassword, setShowcase } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"

type SearchParams = Promise<{ tab?: string }>

const SITE_SECTIONS = [
    { code: "exposition", label: "Выставка" },
]

const tabClass = (active: boolean) =>
    `text-sm px-3 py-1.5 rounded-lg transition-colors ${
        active
            ? "bg-gray-100 text-gray-900 font-medium"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
    }`

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
    const session = await getSession()
    if (!session) redirect("/admin/login")

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
    if (!user) redirect("/admin/login")

    const { tab = "profile" } = await searchParams

    return (
        <div className="py-6">
            <h1 className="text-xl font-bold mb-6">Настройки</h1>

            <div className="flex items-center gap-0.5 mb-8 border-b border-gray-100 pb-3">
                <Link href="/admin/settings?tab=profile" className={tabClass(tab === "profile")}>
                    Профиль
                </Link>
                <Link href="/admin/settings?tab=showcases" className={tabClass(tab === "showcases")}>
                    Витрины
                </Link>
            </div>

            {tab === "profile" && (
                <>
                    <section className="mb-10">
                        <h2 className="text-base font-semibold mb-4">Профиль</h2>
                        <form action={updateProfile} className="flex flex-col gap-4">
                            <Field label="Имя">
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    defaultValue={user.name}
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Email">
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    defaultValue={user.email}
                                    className={inputClass}
                                />
                            </Field>
                            <SubmitButton label="Сохранить" className="mt-2 self-start" />
                        </form>
                    </section>

                    <section>
                        <h2 className="text-base font-semibold mb-4">Смена пароля</h2>
                        <form action={updatePassword} className="flex flex-col gap-4">
                            <Field label="Текущий пароль">
                                <input
                                    name="current"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Новый пароль">
                                <input
                                    name="next"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Повторите новый пароль">
                                <input
                                    name="confirm"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    className={inputClass}
                                />
                            </Field>
                            <SubmitButton label="Изменить пароль" className="mt-2 self-start" />
                        </form>
                    </section>
                </>
            )}

            {tab === "showcases" && <ShowcasesTab />}
        </div>
    )
}

async function ShowcasesTab() {
    const [allArtifacts, currentShowcases] = await Promise.all([
        db
            .select({ id: artifacts.id, title: artifacts.title, artifactType: artifacts.artifactType })
            .from(artifacts)
            .orderBy(artifacts.title),
        db.select().from(showcases),
    ])

    const showcaseMap = Object.fromEntries(currentShowcases.map((s) => [s.sectionCode, s.artifactId]))

    return (
        <div className="flex flex-col gap-6">
            {SITE_SECTIONS.map((section) => (
                <form key={section.code} action={setShowcase} className="flex flex-col gap-3">
                    <input type="hidden" name="sectionCode" value={section.code} />
                    <Field label={section.label}>
                        <select
                            name="artifactId"
                            defaultValue={showcaseMap[section.code] ?? ""}
                            className={inputClass}
                        >
                            <option value="">— не задана —</option>
                            {allArtifacts.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.title}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <SubmitButton label="Сохранить" className="self-start" />
                </form>
            ))}
        </div>
    )
}
