import { createEntity } from "../actions";
import { inputClass, Field } from "@/components/MaterialForm";
import { ImageUpload } from "@/components/ImageUpload";
import { SubmitButton } from "@/components/SubmitButton";

export default function NewEntityPage() {
  return (
    <div className="py-6">
      <h1 className="text-xl font-bold mb-6">Новый человек</h1>
      <form action={createEntity} className="flex flex-col gap-4">
        <Field label="Имя *">
          <input name="name" type="text" required className={inputClass} />
        </Field>
        <Field label="Краткая биография">
          <textarea name="shortBio" rows={3} className={inputClass} />
        </Field>
        <div className="flex gap-4">
          <Field label="Год рождения">
            <input name="birthYear" type="number" min={1800} max={2100} className={inputClass} />
          </Field>
          <Field label="Год смерти">
            <input name="deathYear" type="number" min={1800} max={2100} className={inputClass} />
          </Field>
        </div>
        <Field label="Годы жизни (если точные неизвестны)" hint="Например: «не позднее 1917» или «ок. 1890–1943»">
          <input name="yearsLabel" type="text" className={inputClass} />
        </Field>
        <ImageUpload fileInputName="mainPhotoFile" urlInputName="mainPhotoPath" label="Обложка" />
        <SubmitButton label="Сохранить" className="mt-2" />
      </form>
    </div>
  );
}
