import { db } from "@/db";
import { materials } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { MaterialCard } from "@/components/MaterialCard";

export default async function HomePage() {
  const items = await db
    .select()
    .from(materials)
    .where(eq(materials.status, "published"))
    .orderBy(desc(materials.createdAt));

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Память завода</h1>
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
