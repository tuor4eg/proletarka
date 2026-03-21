import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { entities, people, topics } from "@/db/schema";
import { createMaterial } from "../actions";
import { MaterialForm } from "@/components/MaterialForm";

export default async function NewMaterialPage() {
  const [entityRows, topicRows] = await Promise.all([
    db
      .select({ id: entities.id, type: entities.type, personName: people.name })
      .from(entities)
      .leftJoin(people, eq(entities.personId, people.id)),
    db.select({ id: topics.id, title: topics.title }).from(topics),
  ]);

  const entitiesList = entityRows.map((r) => ({
    id: r.id,
    type: r.type,
    displayName: r.personName ?? r.id.toString(),
  }));

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
        ← Все материалы
      </Link>
      <h1 className="text-xl font-bold mb-6">Новый материал</h1>
      <MaterialForm action={createMaterial} entities={entitiesList} topics={topicRows} />
    </main>
  );
}
