import Link from "next/link";
import { db } from "@/db";
import { materials, entities, people, materialTopics, topics } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { MaterialCard } from "@/components/MaterialCard";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const [session, rows] = await Promise.all([
    getSession(),
    db
      .select({
        id: materials.id,
        title: materials.title,
        summary: materials.summary,
        yearFrom: materials.yearFrom,
        yearTo: materials.yearTo,
        personName: people.name,
        topicTitle: topics.title,
      })
      .from(materials)
      .leftJoin(entities, eq(materials.entityId, entities.id))
      .leftJoin(people, eq(entities.personId, people.id))
      .leftJoin(materialTopics, eq(materials.id, materialTopics.materialId))
      .leftJoin(topics, eq(materialTopics.topicId, topics.id))
      .where(eq(materials.status, "published"))
      .orderBy(desc(materials.createdAt)),
  ]);

  const order: number[] = [];
  const itemsMap = new Map<number, {
    id: number;
    title: string;
    summary: string | null;
    yearFrom: number | null;
    yearTo: number | null;
    personName: string | null;
    topics: string[];
  }>();

  for (const row of rows) {
    if (!itemsMap.has(row.id)) {
      order.push(row.id);
      itemsMap.set(row.id, { ...row, topics: [] });
    }
    if (row.topicTitle) {
      itemsMap.get(row.id)!.topics.push(row.topicTitle);
    }
  }

  const items = order.map((id) => itemsMap.get(id)!);

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Память завода</h1>
          <p className="text-sm text-gray-500">Люди, события и находки из истории завода</p>
        </div>
        {session ? (
          <Link
            href="/admin"
            className="text-sm bg-black text-white rounded-xl px-4 py-2 hover:bg-gray-800 transition-colors shrink-0"
          >
            Админка
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0"
          >
            Войти
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">Материалов пока нет.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      )}
    </main>
  );
}
