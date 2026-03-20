import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { materials, topics } from "@/db/schema";
import { updateMaterial } from "../actions";
import { MaterialForm } from "@/components/MaterialForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditMaterialPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    notFound();
  }

  const [[material], topicsList] = await Promise.all([
    db.select().from(materials).where(eq(materials.id, numericId)).limit(1),
    db.select().from(topics).orderBy(asc(topics.label)),
  ]);

  if (!material) {
    notFound();
  }

  const action = updateMaterial.bind(null, numericId);

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800 mb-6 inline-block">
        ← Все материалы
      </Link>
      <h1 className="text-xl font-bold mb-6">Редактировать материал</h1>
      <MaterialForm action={action} material={material} topics={topicsList} />
    </main>
  );
}
