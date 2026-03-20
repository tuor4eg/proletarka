import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { topics } from "@/db/schema";

export default async function TopicsPage() {
  const list = await db.select().from(topics).orderBy(asc(topics.label));

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">
            ← Материалы
          </Link>
          <h1 className="text-xl font-bold">Темы</h1>
        </div>
        <Link
          href="/admin/topics/new"
          className="text-sm bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-800 transition-colors"
        >
          + Добавить
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-gray-500">Тем пока нет.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((topic) => (
            <Link
              key={topic.id}
              href={`/admin/topics/${topic.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-400 transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{topic.label}</span>
                <span className="text-xs text-gray-400">{topic.code}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
