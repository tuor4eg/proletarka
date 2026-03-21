import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { entities, people } from "@/db/schema";

export default async function EntitiesPage() {
  const rows = await db
    .select({ id: entities.id, type: entities.type, personName: people.name })
    .from(entities)
    .leftJoin(people, eq(entities.personId, people.id));

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">
            ← Материалы
          </Link>
          <h1 className="text-xl font-bold">Карточки</h1>
        </div>
        <Link
          href="/admin/entities/new"
          className="text-sm bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-800 transition-colors"
        >
          + Добавить
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">Карточек пока нет.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/admin/entities/${row.id}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-400 transition-colors"
            >
              <span className="text-sm font-medium">{row.personName ?? `#${row.id}`}</span>
              <span className="text-xs text-gray-400">Человек</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
