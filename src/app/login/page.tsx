import { login } from "./actions";
import { inputClass } from "@/components/MaterialForm";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-xl font-bold mb-6">Вход</h1>
      <form action={login} className="flex flex-col gap-4">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
            Неверный email или пароль
          </p>
        )}
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          className={inputClass}
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Пароль"
          autoComplete="current-password"
          className={inputClass}
        />
        <button
          type="submit"
          className="bg-black text-white text-sm font-medium rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors"
        >
          Войти
        </button>
      </form>
    </main>
  );
}
