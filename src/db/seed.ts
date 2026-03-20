import { db } from "./index";
import { materials, topics } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  const [peopleTopic] = await db.select().from(topics).where(eq(topics.code, "people")).limit(1);
  const [warTopic] = await db.select().from(topics).where(eq(topics.code, "war")).limit(1);

  await db.insert(materials).values([
    {
      code: "evdokimov-nikolay",
      title: "Евдокимов Николай Петрович",
      summary: "Токарь высшего разряда, проработал на заводе 38 лет. Ветеран труда.",
      content: "Николай Петрович пришёл на завод в 1961 году сразу после армии. За три с лишним десятилетия он обучил более сорока учеников.",
      topicId: peopleTopic.id,
      status: "published",
      yearFrom: 1961,
      yearTo: 1999,
    },
    {
      code: "workshop-1943",
      title: "Цех № 3 в годы войны",
      summary: "В 1943 году цех перешёл на выпуск военной продукции. Работали в три смены.",
      content: "С началом перестройки производства рабочие цеха № 3 освоили новую номенклатуру изделий за несколько недель. Документы об этом периоде частично сохранились в заводском архиве.",
      topicId: warTopic.id,
      status: "published",
      yearFrom: 1943,
      yearTo: 1945,
    },
  ]);

  console.log("Seed complete");
  process.exit(0);
}

seed();
