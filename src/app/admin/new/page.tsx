import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { createMaterial } from "../actions";
import { MaterialForm } from "@/components/MaterialForm";

export default async function NewMaterialPage() {
  const topicsList = await db.select().from(topics).orderBy(asc(topics.label));

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
        ← Все материалы
      </Link>
      <h1 className="text-xl font-bold mb-6">Новый материал</h1>
      <MaterialForm action={createMaterial} topics={topicsList} />
    </main>
  );
}
