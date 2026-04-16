import {
    pgEnum,
    pgTable,
    serial,
    text,
    integer,
    timestamp,
    primaryKey,
    boolean,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const statusEnum = pgEnum("status", ["draft", "published"])
export const roleEnum = pgEnum("role", ["admin"])
export const materialTypeEnum = pgEnum("material_type", [
    "article",
    "news",
    "photo",
    "group_photo",
    "document",
])
export const artifactTypeEnum = pgEnum("artifact_type", ["general", "stand", "rarity", "fund"])
export const commentStatusEnum = pgEnum("comment_status", ["pending", "approved", "hidden"])

export type MaterialType = (typeof materialTypeEnum.enumValues)[number]
export type Status = (typeof statusEnum.enumValues)[number]
export type EntityType = (typeof entityTypeEnum.enumValues)[number]
export type ArtifactType = (typeof artifactTypeEnum.enumValues)[number]
export type CommentStatus = (typeof commentStatusEnum.enumValues)[number]

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
    isSystem: boolean("is_system").notNull().default(false),
    parentId: integer("parent_id").references(() => topics.id, { onDelete: "set null" }),
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
    yearFrom: integer("year_from"),
    yearTo: integer("year_to"),
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

export const sources = pgTable("sources", {
    id: serial("id").primaryKey(),
    label: text("label").notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
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
    artifactId: integer("artifact_id")
        .notNull()
        .references(() => artifacts.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
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
    sectionId: integer("section_id").references(() => artifactSections.id, {
        onDelete: "set null",
    }),
    yearFrom: integer("year_from"),
    yearTo: integer("year_to"),
    coverImagePath: text("cover_image_path"),
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

export const personMaterials = pgTable(
    "person_materials",
    {
        personId: integer("person_id")
            .notNull()
            .references(() => people.id, { onDelete: "cascade" }),
        materialId: integer("material_id")
            .notNull()
            .references(() => materials.id, { onDelete: "cascade" }),
    },
    (t) => [primaryKey({ columns: [t.personId, t.materialId] })],
)

export const personSources = pgTable(
    "person_sources",
    {
        personId: integer("person_id")
            .notNull()
            .references(() => people.id, { onDelete: "cascade" }),
        sourceId: integer("source_id")
            .notNull()
            .references(() => sources.id, { onDelete: "cascade" }),
    },
    (t) => [primaryKey({ columns: [t.personId, t.sourceId] })],
)

export const materialSources = pgTable(
    "material_sources",
    {
        materialId: integer("material_id")
            .notNull()
            .references(() => materials.id, { onDelete: "cascade" }),
        sourceId: integer("source_id")
            .notNull()
            .references(() => sources.id, { onDelete: "cascade" }),
    },
    (t) => [primaryKey({ columns: [t.materialId, t.sourceId] })],
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

export const artifactMaterials = pgTable(
    "artifact_materials",
    {
        artifactId: integer("artifact_id")
            .notNull()
            .references(() => artifacts.id, { onDelete: "cascade" }),
        materialId: integer("material_id")
            .notNull()
            .references(() => materials.id, { onDelete: "cascade" }),
        sectionId: integer("section_id").references(() => artifactSections.id, {
            onDelete: "set null",
        }),
        position: integer("position"),
    },
    (t) => [primaryKey({ columns: [t.artifactId, t.materialId] })],
)

export const showcases = pgTable("showcases", {
    sectionCode: text("section_code").primaryKey(),
    artifactId: integer("artifact_id")
        .notNull()
        .references(() => artifacts.id, { onDelete: "cascade" }),
})

export const comments = pgTable("comments", {
    id: serial("id").primaryKey(),
    entityId: integer("entity_id")
        .notNull()
        .references(() => entities.id, { onDelete: "cascade" }),
    status: commentStatusEnum("status").notNull().default("pending"),
    author: text("author"),
    body: text("body").notNull(),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    moderatedAt: timestamp("moderated_at"),
    moderatedBy: integer("moderated_by").references(() => users.id),
})

export const adminActionEnum = pgEnum("admin_action", [
    "create",
    "update",
    "delete",
    "publish",
    "unpublish",
])
export const adminEntityTypeEnum = pgEnum("admin_entity_type", [
    "person",
    "artifact",
    "artifactSection",
    "material",
    "topic",
])

export const adminLogs = pgTable("admin_logs", {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
        .notNull()
        .references(() => users.id),
    action: adminActionEnum("action").notNull(),
    entityType: adminEntityTypeEnum("entity_type").notNull(),
    entityId: integer("entity_id"),
    entityTitle: text("entity_title"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const adminLogsRelations = relations(adminLogs, ({ one }) => ({
    user: one(users, { fields: [adminLogs.userId], references: [users.id] }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
    entity: one(entities, { fields: [comments.entityId], references: [entities.id] }),
    moderator: one(users, { fields: [comments.moderatedBy], references: [users.id] }),
}))

export const artifactsRelations = relations(artifacts, ({ many }) => ({
    entities: many(entities),
    sections: many(artifactSections),
    artifactMaterials: many(artifactMaterials),
}))

export const artifactSectionsRelations = relations(artifactSections, ({ one, many }) => ({
    artifact: one(artifacts, { fields: [artifactSections.artifactId], references: [artifacts.id] }),
    materials: many(materials),
}))

export const peopleRelations = relations(people, ({ many }) => ({
    entities: many(entities),
    personMaterials: many(personMaterials),
    personSources: many(personSources),
}))

export const entitiesRelations = relations(entities, ({ one, many }) => ({
    person: one(people, { fields: [entities.personId], references: [people.id] }),
    artifact: one(artifacts, { fields: [entities.artifactId], references: [artifacts.id] }),
    materials: many(materials),
    events: many(events),
    entityTopics: many(entityTopics),
    comments: many(comments),
}))

export const materialsRelations = relations(materials, ({ one, many }) => ({
    entity: one(entities, { fields: [materials.entityId], references: [entities.id] }),
    section: one(artifactSections, {
        fields: [materials.sectionId],
        references: [artifactSections.id],
    }),
    materialTopics: many(materialTopics),
    personMaterials: many(personMaterials),
    materialSources: many(materialSources),
    artifactMaterials: many(artifactMaterials),
}))

export const personMaterialsRelations = relations(personMaterials, ({ one }) => ({
    person: one(people, { fields: [personMaterials.personId], references: [people.id] }),
    material: one(materials, { fields: [personMaterials.materialId], references: [materials.id] }),
}))

export const sourcesRelations = relations(sources, ({ many }) => ({
    personSources: many(personSources),
    materialSources: many(materialSources),
}))

export const personSourcesRelations = relations(personSources, ({ one }) => ({
    person: one(people, { fields: [personSources.personId], references: [people.id] }),
    source: one(sources, { fields: [personSources.sourceId], references: [sources.id] }),
}))

export const materialSourcesRelations = relations(materialSources, ({ one }) => ({
    material: one(materials, {
        fields: [materialSources.materialId],
        references: [materials.id],
    }),
    source: one(sources, { fields: [materialSources.sourceId], references: [sources.id] }),
}))

export const artifactMaterialsRelations = relations(artifactMaterials, ({ one }) => ({
    artifact: one(artifacts, {
        fields: [artifactMaterials.artifactId],
        references: [artifacts.id],
    }),
    material: one(materials, {
        fields: [artifactMaterials.materialId],
        references: [materials.id],
    }),
    section: one(artifactSections, {
        fields: [artifactMaterials.sectionId],
        references: [artifactSections.id],
    }),
}))

export const materialTopicsRelations = relations(materialTopics, ({ one }) => ({
    material: one(materials, { fields: [materialTopics.materialId], references: [materials.id] }),
    topic: one(topics, { fields: [materialTopics.topicId], references: [topics.id] }),
}))

export const eventsRelations = relations(events, ({ one, many }) => ({
    entity: one(entities, { fields: [events.entityId], references: [entities.id] }),
    eventTopics: many(eventTopics),
}))

export const topicsRelations = relations(topics, ({ one, many }) => ({
    parent: one(topics, { fields: [topics.parentId], references: [topics.id] }),
    children: many(topics),
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
