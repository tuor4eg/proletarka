import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { users } from "@/db/schema"
import { getSession } from "@/lib/session"
import { inputClass, Field } from "@/components/MaterialForm"
import { updateProfile, updatePassword } from "./actions"
import { SubmitButton } from "@/components/SubmitButton"

export default async function SettingsPage() {
    const session = await getSession()
    if (!session) redirect("/admin/login")

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
    if (!user) redirect("/admin/login")

    return (
        <div className="py-6">
            <h1 className="text-xl font-bold mb-8">Настройки</h1>

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
        </div>
    )
}
