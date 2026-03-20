import Link from "next/link";
import { desc, eq, getTableColumns } from "drizzle-orm";
import { db } from "@/db";
import { materials, topics } from "@/db/schema";
import { STATUSES } from "@/components/MaterialForm";

const STATUS_LABEL = Object.fromEntries(STATUSES.map(({ value, label }) => [value, label]));

export default async function AdminPage() {
  const items = await db
    .select({
      ...getTableColumns(materials),
      topicLabel: topics.label,
    })
    .from(materials)
    .innerJoin(topics, eq(materials.topicId, topics.id))
    .orderBy(desc(materials.createdAt));

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Материалы</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/topics"
            className="text-sm border border-gray-300 rounded-xl px-4 py-2 hover:border-gray-500 transition-colors"
          >
            Темы
          </Link>
          <Link
            href="/admin/new"
            className="text-sm bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-800 transition-colors"
          >
            + Добавить
          </Link>
          <form action="/admin/logout" method="POST">
            <button
              type="submit"
              className="text-sm border border-gray-300 rounded-xl px-4 py-2 hover:border-gray-500 transition-colors"
            >
              Выйти
            </button>
          </form>
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
                <span className="text-xs text-gray-400">{item.topicLabel}</span>
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
