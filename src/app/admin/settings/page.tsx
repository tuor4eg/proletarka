import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { inputClass, Field } from "@/components/MaterialForm";
import { updateProfile, updatePassword } from "./actions";

const PASSWORD_ERRORS: Record<string, string> = {
  wrong: "Неверный текущий пароль",
  mismatch: "Новые пароли не совпадают",
  short: "Новый пароль должен быть не короче 8 символов",
};

type Props = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) redirect("/admin/login");

  const { error, success } = await searchParams;

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
        ← Назад
      </Link>
      <h1 className="text-xl font-bold mb-8">Настройки</h1>

      <section className="mb-10">
        <h2 className="text-base font-semibold mb-4">Профиль</h2>
        {success === "profile" && (
          <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2 mb-4">
            Данные сохранены
          </p>
        )}
        <form action={updateProfile} className="flex flex-col gap-4">
          <Field label="Имя">
            <input name="name" type="text" required defaultValue={user.name} className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required defaultValue={user.email} className={inputClass} />
          </Field>
          <button
            type="submit"
            className="mt-2 bg-black text-white text-sm font-medium rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            Сохранить
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-4">Смена пароля</h2>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-4">
            {PASSWORD_ERRORS[error] ?? "Ошибка"}
          </p>
        )}
        {success === "password" && (
          <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2 mb-4">
            Пароль изменён
          </p>
        )}
        <form action={updatePassword} className="flex flex-col gap-4">
          <Field label="Текущий пароль">
            <input name="current" type="password" required autoComplete="current-password" className={inputClass} />
          </Field>
          <Field label="Новый пароль">
            <input name="next" type="password" required autoComplete="new-password" className={inputClass} />
          </Field>
          <Field label="Повторите новый пароль">
            <input name="confirm" type="password" required autoComplete="new-password" className={inputClass} />
          </Field>
          <button
            type="submit"
            className="mt-2 bg-black text-white text-sm font-medium rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors"
          >
            Изменить пароль
          </button>
        </form>
      </section>
    </main>
  );
}
