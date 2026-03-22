import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { topics } from "@/db/schema";

export default async function TopicsPage() {
  const list = await db.select().from(topics).orderBy(asc(topics.title));

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Темы</h1>
        <Link
          href="/admin/topics/new"
          className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
        >
          + Добавить
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-gray-500">Тем пока нет.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {list.map((topic) => (
            <Link
              key={topic.id}
              href={`/admin/topics/${topic.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium flex-1">{topic.title}</span>
              <span className="text-xs text-gray-400">{topic.code}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
