import { pgEnum, pgTable, serial, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const statusEnum = pgEnum("status", ["draft", "published"])
export const roleEnum = pgEnum("role", ["admin"])
export const materialTypeEnum = pgEnum("material_type", ["article", "photo", "document"])
export const artifactTypeEnum = pgEnum("artifact_type", ["general", "stand"])

export type MaterialType = (typeof materialTypeEnum.enumValues)[number]
export type Status = (typeof statusEnum.enumValues)[number]
export type EntityType = (typeof entityTypeEnum.enumValues)[number]
export type ArtifactType = (typeof artifactTypeEnum.enumValues)[number]

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

export const entityTypeEnum = pgEnum("entity_type", ["person", "artifact"])

export const artifacts = pgTable("artifacts", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    yearsLabel: text("years_label"),
    artifactType: artifactTypeEnum("artifact_type").notNull().default("general"),
    coverImagePath: text("cover_image_path"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

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
    artifactId: integer("artifact_id").references(() => artifacts.id, { onDelete: "cascade" }),
    code: text("code").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const artifactSections = pgTable("artifact_sections", {
    id: serial("id").primaryKey(),
    artifactId: integer("artifact_id").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
    sectionId: integer("section_id").references(() => artifactSections.id, { onDelete: "set null" }),
    yearFrom: integer("year_from"),
    yearTo: integer("year_to"),
    coverImagePath: text("cover_image_path"),
    sourceUrl: text("source_url"),
    position: integer("position"),
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

export const entityTopics = pgTable(
    "entity_topics",
    {
        entityId: integer("entity_id")
            .notNull()
            .references(() => entities.id, { onDelete: "cascade" }),
        topicId: integer("topic_id")
            .notNull()
            .references(() => topics.id, { onDelete: "cascade" }),
    },
    (t) => [primaryKey({ columns: [t.entityId, t.topicId] })],
)

export const artifactsRelations = relations(artifacts, ({ many }) => ({
    entities: many(entities),
    sections: many(artifactSections),
}))

export const artifactSectionsRelations = relations(artifactSections, ({ one, many }) => ({
    artifact: one(artifacts, { fields: [artifactSections.artifactId], references: [artifacts.id] }),
    materials: many(materials),
}))

export const peopleRelations = relations(people, ({ many }) => ({
    entities: many(entities),
}))

export const entitiesRelations = relations(entities, ({ one, many }) => ({
    person: one(people, { fields: [entities.personId], references: [people.id] }),
    artifact: one(artifacts, { fields: [entities.artifactId], references: [artifacts.id] }),
    materials: many(materials),
    events: many(events),
    entityTopics: many(entityTopics),
}))

export const materialsRelations = relations(materials, ({ one, many }) => ({
    entity: one(entities, { fields: [materials.entityId], references: [entities.id] }),
    section: one(artifactSections, { fields: [materials.sectionId], references: [artifactSections.id] }),
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
    entityTopics: many(entityTopics),
}))

export const entityTopicsRelations = relations(entityTopics, ({ one }) => ({
    entity: one(entities, { fields: [entityTopics.entityId], references: [entities.id] }),
    topic: one(topics, { fields: [entityTopics.topicId], references: [topics.id] }),
}))

export const eventTopicsRelations = relations(eventTopics, ({ one }) => ({
    event: one(events, { fields: [eventTopics.eventId], references: [events.id] }),
    topic: one(topics, { fields: [eventTopics.topicId], references: [topics.id] }),
}))
