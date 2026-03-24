import { pgEnum, pgTable, serial, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const statusEnum = pgEnum("status", ["draft", "published"])
export const roleEnum = pgEnum("role", ["admin"])
export const materialTypeEnum = pgEnum("material_type", ["article", "photo", "document"])

export type MaterialType = (typeof materialTypeEnum.enumValues)[number]
export type Status = (typeof statusEnum.enumValues)[number]
export type EntityType = (typeof entityTypeEnum.enumValues)[number]

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    password: text("password").notNull(),
    role: roleEnum("role").notNull().default("admin"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const topics = pgTable("topics", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const entityTypeEnum = pgEnum("entity_type", ["person"])

export const people = pgTable("people", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    shortBio: text("short_bio"),
    birthYear: integer("birth_year"),
    deathYear: integer("death_year"),
    yearsLabel: text("years_label"),
    mainPhotoPath: text("main_photo_path"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const entities = pgTable("entities", {
    id: serial("id").primaryKey(),
    type: entityTypeEnum("type").notNull(),
    personId: integer("person_id").references(() => people.id),
    code: text("code").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const materials = pgTable("materials", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary"),
    content: text("content"),
    materialType: materialTypeEnum("material_type").notNull().default("article"),
    status: statusEnum("status").notNull().default("draft"),
    entityId: integer("entity_id").references(() => entities.id),
    yearFrom: integer("year_from"),
    yearTo: integer("year_to"),
    coverImagePath: text("cover_image_path"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const materialTopics = pgTable(
    "material_topics",
    {
        materialId: integer("material_id")
            .notNull()
            .references(() => materials.id),
        topicId: integer("topic_id")
            .notNull()
            .references(() => topics.id),
    },
    (t) => [primaryKey({ columns: [t.materialId, t.topicId] })],
)

export const events = pgTable("events", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    entityId: integer("entity_id")
        .notNull()
        .references(() => entities.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    yearFrom: integer("year_from"),
    yearTo: integer("year_to"),
    yearsLabel: text("years_label"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const eventTopics = pgTable(
    "event_topics",
    {
        eventId: integer("event_id")
            .notNull()
            .references(() => events.id, { onDelete: "cascade" }),
        topicId: integer("topic_id")
            .notNull()
            .references(() => topics.id, { onDelete: "cascade" }),
    },
    (t) => [primaryKey({ columns: [t.eventId, t.topicId] })],
)

export const peopleRelations = relations(people, ({ many }) => ({
    entities: many(entities),
}))

export const entitiesRelations = relations(entities, ({ one, many }) => ({
    person: one(people, { fields: [entities.personId], references: [people.id] }),
    materials: many(materials),
    events: many(events),
}))

export const materialsRelations = relations(materials, ({ one, many }) => ({
    entity: one(entities, { fields: [materials.entityId], references: [entities.id] }),
    materialTopics: many(materialTopics),
}))

export const materialTopicsRelations = relations(materialTopics, ({ one }) => ({
    material: one(materials, { fields: [materialTopics.materialId], references: [materials.id] }),
    topic: one(topics, { fields: [materialTopics.topicId], references: [topics.id] }),
}))

export const eventsRelations = relations(events, ({ one, many }) => ({
    entity: one(entities, { fields: [events.entityId], references: [entities.id] }),
    eventTopics: many(eventTopics),
}))

export const topicsRelations = relations(topics, ({ many }) => ({
    materialTopics: many(materialTopics),
    eventTopics: many(eventTopics),
}))

export const eventTopicsRelations = relations(eventTopics, ({ one }) => ({
    event: one(events, { fields: [eventTopics.eventId], references: [events.id] }),
    topic: one(topics, { fields: [eventTopics.topicId], references: [topics.id] }),
}))
