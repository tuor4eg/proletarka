"use client";

import { useState } from "react";
import { InferSelectModel } from "drizzle-orm";
import { materials } from "@/db/schema";
import { ImageUpload } from "@/components/ImageUpload";

type Material = InferSelectModel<typeof materials>;

export type EntityOption = {
  id: number;
  type: "person";
  displayName: string;
};

export type TopicOption = {
  id: number;
  title: string;
};

export const STATUSES = [
  { value: "draft", label: "Черновик" },
  { value: "published", label: "Опубликовано" },
] as const;

export const MATERIAL_TYPES = [
  { value: "article", label: "Статья" },
  { value: "photo", label: "Фото" },
  { value: "document", label: "Документ" },
] as const;

const ENTITY_TYPES = [
  { value: "person", label: "Человек" },
] as const;

export const inputClass =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}

type Props = {
  action: (formData: FormData) => Promise<void>;
  material?: Material;
  entities: EntityOption[];
  topics: TopicOption[];
  selectedTopicIds?: number[];
};

export function MaterialForm({ action, material, entities, topics, selectedTopicIds = [] }: Props) {
  const initialEntity = material?.entityId
    ? entities.find((e) => e.id === material.entityId) ?? null
    : null;

  const [entityType, setEntityType] = useState<"person" | "">(
    initialEntity?.type ?? ""
  );
  const [entityId, setEntityId] = useState<string>(
    material?.entityId?.toString() ?? ""
  );

  const filteredEntities = entities.filter((e) => e.type === entityType);

  function handleEntityTypeChange(value: "person" | "") {
    setEntityType(value);
    setEntityId("");
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Заголовок *">
        <input
          name="title"
          type="text"
          required
          defaultValue={material?.title ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Тип *">
        <select name="materialType" required defaultValue={material?.materialType ?? "article"} className={inputClass}>
          {MATERIAL_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </Field>

      <Field label="Тип карточки">
        <select
          value={entityType}
          onChange={(e) => handleEntityTypeChange(e.target.value as "person" | "")}
          className={inputClass}
        >
          <option value="">— без карточки —</option>
          {ENTITY_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </Field>

      {entityType && (
        <Field label="Карточка">
          <select
            name="entityId"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className={inputClass}
          >
            <option value="">— выбрать —</option>
            {filteredEntities.map((entity) => (
              <option key={entity.id} value={entity.id}>{entity.displayName}</option>
            ))}
          </select>
        </Field>
      )}

      {!entityType && <input type="hidden" name="entityId" value="" />}

      {topics.length > 0 && (
        <Field label="Темы">
          <div className="flex flex-col gap-1.5 pt-0.5">
            {topics.map((topic) => (
              <label key={topic.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="topicIds"
                  value={topic.id}
                  defaultChecked={selectedTopicIds.includes(topic.id)}
                  className="rounded"
                />
                {topic.title}
              </label>
            ))}
          </div>
        </Field>
      )}

      <Field label="Краткое описание">
        <textarea
          name="summary"
          rows={2}
          defaultValue={material?.summary ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Текст">
        <textarea
          name="content"
          rows={6}
          defaultValue={material?.content ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="flex gap-4">
        <Field label="Год (от)">
          <input
            name="yearFrom"
            type="number"
            min={1800}
            max={2100}
            defaultValue={material?.yearFrom ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Год (до)">
          <input
            name="yearTo"
            type="number"
            min={1800}
            max={2100}
            defaultValue={material?.yearTo ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <ImageUpload
        fileInputName="coverImageFile"
        urlInputName="coverImagePath"
        defaultUrl={material?.coverImagePath}
        label="Обложка"
      />

      <Field label="Ссылка на источник">
        <input
          name="sourceUrl"
          type="url"
          defaultValue={material?.sourceUrl ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Статус">
        <select
          name="status"
          required
          defaultValue={material?.status ?? "draft"}
          className={inputClass}
        >
          {STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </Field>

      <button
        type="submit"
        className="mt-2 bg-black text-white text-sm font-medium rounded-xl px-4 py-3 hover:bg-gray-800 transition-colors"
      >
        Сохранить
      </button>
    </form>
  );
}
