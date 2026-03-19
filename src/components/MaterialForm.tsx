import { InferSelectModel } from "drizzle-orm";
import { materials } from "@/db/schema";

type Material = InferSelectModel<typeof materials>;

export const THEMES = [
  { value: "people", label: "Люди" },
  { value: "war", label: "Война" },
  { value: "documents", label: "Документы" },
  { value: "photos", label: "Фото" },
  { value: "factory_today", label: "Завод сегодня" },
] as const;

export const STATUSES = [
  { value: "draft", label: "Черновик" },
  { value: "published", label: "Опубликовано" },
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
};

export function MaterialForm({ action, material }: Props) {
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

      <Field label="Тема *">
        <select name="theme" required defaultValue={material?.theme ?? ""} className={inputClass}>
          <option value="">— выбрать —</option>
          {THEMES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
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
