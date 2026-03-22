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
    <div className="py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Карточки</h1>
        <Link
          href="/admin/entities/new"
          className="text-sm bg-black text-white rounded-lg px-3 py-1.5 hover:bg-gray-800 transition-colors"
        >
          + Добавить
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">Карточек пока нет.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {rows.map((row) => (
            <Link
              key={row.id}
              href={`/admin/entities/${row.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium flex-1">{row.personName ?? `#${row.id}`}</span>
              <span className="text-xs text-gray-400">Человек</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
