import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { materials } from "@/db/schema";
const STATUS_LABEL: Record<string, string> = { draft: "Черновик", published: "Опубликовано" };
const TYPE_LABEL: Record<string, string> = { article: "Статья", photo: "Фото", document: "Документ" };

export default async function AdminPage() {
  const items = await db
    .select()
    .from(materials)
    .orderBy(desc(materials.createdAt));

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Материалы</h1>
          <Link
            href="/admin/new"
            className="text-sm bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-800 transition-colors"
          >
            + Добавить
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">← Сайт</Link>
          <Link href="/admin/entities" className="text-sm text-gray-500 hover:text-gray-800">Карточки</Link>
          <Link href="/admin/topics" className="text-sm text-gray-500 hover:text-gray-800">Темы</Link>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/admin/settings" className="text-sm text-gray-500 hover:text-gray-800">Настройки</Link>
            <form action="/admin/logout" method="POST">
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-800">Выйти</button>
            </form>
          </div>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Материалов пока нет.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/${item.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-400 transition-colors"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium truncate">{item.title}</span>
                <span className="text-xs text-gray-400">{TYPE_LABEL[item.materialType]}</span>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-3 ${
                  item.status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {STATUS_LABEL[item.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
