"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { InferSelectModel } from "drizzle-orm";
import { materials } from "@/db/schema";
import { ImageUpload } from "@/components/ImageUpload";
import { DeleteButton } from "@/components/DeleteButton";

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
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
    </div>
  );
}

type Props = {
  action: (formData: FormData) => Promise<void>;
  deleteAction?: () => Promise<void>;
  material?: Material;
  entities: EntityOption[];
  topics: TopicOption[];
  selectedTopicIds?: number[];
  defaultEntityId?: number;
  defaultMaterialType?: string;
};

function FormActions({ deleteAction }: { deleteAction?: () => Promise<void> }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center gap-3 mt-5">
      <button
        type="submit"
        disabled={pending}
        className="bg-black text-white text-sm font-medium rounded-xl px-5 py-2.5 hover:bg-gray-800 disabled:opacity-60 transition-colors"
      >
        {pending ? "Сохранение…" : "Сохранить"}
      </button>
      <a
        href="/admin"
        className="text-sm font-medium text-gray-500 border border-gray-200 rounded-xl px-5 py-2.5 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        Отмена
      </a>
      {deleteAction && <DeleteButton action={deleteAction} />}
    </div>
  );
}

export function MaterialForm({ action, deleteAction, material, entities, topics, selectedTopicIds = [], defaultEntityId, defaultMaterialType }: Props) {
  const initialEntityId = material?.entityId ?? defaultEntityId;
  const initialEntity = initialEntityId
    ? entities.find((e) => e.id === initialEntityId) ?? null
    : null;

  const [entityType, setEntityType] = useState<"person" | "">(
    initialEntity?.type ?? ""
  );
  const [entityId, setEntityId] = useState<string>(
    initialEntityId?.toString() ?? ""
  );

  const filteredEntities = entities.filter((e) => e.type === entityType);

  function handleEntityTypeChange(value: "person" | "") {
    setEntityType(value);
    setEntityId("");
  }

  return (
    <>
    <form action={action} className="grid grid-cols-[1fr_240px] gap-5 items-start w-full">
      {/* Left: main content */}
      <div className="flex flex-col gap-4">
        <Field label="Заголовок *">
          <input
            name="title"
            type="text"
            required
            defaultValue={material?.title ?? ""}
            className={inputClass}
          />
        </Field>

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
            rows={10}
            defaultValue={material?.content ?? ""}
            className={inputClass}
          />
        </Field>

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
      </div>

      {/* Right: meta sidebar */}
      <div className="flex flex-col gap-3 bg-white border border-gray-200 rounded-xl p-4">
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

        <Field label="Тип *">
          <select
            name="materialType"
            required
            defaultValue={material?.materialType ?? defaultMaterialType ?? "article"}
            className={inputClass}
          >
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

        <div className="flex gap-2">
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

      </div>

      <FormActions deleteAction={deleteAction} />
    </form>
    </>
  );
}
