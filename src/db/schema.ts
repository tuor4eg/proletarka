import { pgEnum, pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const statusEnum = pgEnum("status", ["draft", "published"]);
export const roleEnum = pgEnum("role", ["admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content"),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  status: statusEnum("status").notNull().default("draft"),
  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),
  coverImagePath: text("cover_image_path"),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const materialsRelations = relations(materials, ({ one }) => ({
  topic: one(topics, { fields: [materials.topicId], references: [topics.id] }),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
  materials: many(materials),
}));
