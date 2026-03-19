import { pgEnum, pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const themeEnum = pgEnum("theme", [
  "people",
  "war",
  "documents",
  "photos",
  "factory_today",
]);

export const statusEnum = pgEnum("status", ["draft", "published"]);

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content"),
  theme: themeEnum("theme").notNull(),
  status: statusEnum("status").notNull().default("draft"),
  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),
  coverImagePath: text("cover_image_path"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
