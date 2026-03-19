import { db } from "./index";
import { materials } from "./schema";

async function seed() {
  await db.insert(materials).values([
    {
      code: "evdokimov-nikolay",
      title: "Евдокимов Николай Петрович",
      summary: "Токарь высшего разряда, проработал на заводе 38 лет. Ветеран труда.",
      content: "Николай Петрович пришёл на завод в 1961 году сразу после армии. За три с лишним десятилетия он обучил более сорока учеников.",
      theme: "people",
      status: "published",
      yearFrom: 1961,
      yearTo: 1999,
    },
    {
      code: "workshop-1943",
      title: "Цех № 3 в годы войны",
      summary: "В 1943 году цех перешёл на выпуск военной продукции. Работали в три смены.",
      content: "С началом перестройки производства рабочие цеха № 3 освоили новую номенклатуру изделий за несколько недель. Документы об этом периоде частично сохранились в заводском архиве.",
      theme: "war",
      status: "published",
      yearFrom: 1943,
      yearTo: 1945,
    },
  ]);

  console.log("Seed complete");
  process.exit(0);
}

seed();
