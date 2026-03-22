import { db } from "@/db";
import { materials, entities, people, materialTopics, topics } from "@/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { MaterialCard } from "@/components/MaterialCard";
import { FilterBar } from "@/components/FilterBar";
import { PublicNavWrapper } from "@/components/PublicNavWrapper";

type SearchParams = Promise<{ topic?: string }>;

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const { topic } = await searchParams;

  const activeTopics = topic ? topic.split(",").filter(Boolean) : [];

  const topicFilter =
    activeTopics.length > 0
      ? inArray(
          materials.id,
          db
            .select({ id: materialTopics.materialId })
            .from(materialTopics)
            .innerJoin(topics, eq(materialTopics.topicId, topics.id))
            .where(inArray(topics.code, activeTopics))
        )
      : undefined;

  const [allTopics, rows] = await Promise.all([
    db.select({ code: topics.code, title: topics.title }).from(topics).orderBy(topics.title),
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
      .where(and(eq(materials.status, "published"), topicFilter))
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
    <>
      <PublicNavWrapper />
      <main className="max-w-lg mx-auto px-4 py-6">
        <FilterBar topics={allTopics} activeTopics={activeTopics} />
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm mt-6">Материалов пока нет.</p>
        ) : (
          <div className="flex flex-col gap-4 mt-6">
            {items.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
