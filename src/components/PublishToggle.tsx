"use client";

import { useFormStatus } from "react-dom";
import { Globe, GlobeLock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toggleMaterialStatus } from "@/app/admin/actions";
import { type Status } from "@/db/schema";

type Props = {
  id: number;
  status: Status;
};

function ToggleButton({ isPublished }: { isPublished: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => e.stopPropagation()}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
        isPublished
          ? "text-green-600 hover:bg-green-50"
          : "text-gray-400 hover:bg-gray-100"
      }`}
    >
      {isPublished ? <Globe size={15} /> : <GlobeLock size={15} />}
    </button>
  );
}

export function PublishToggle({ id, status }: Props) {
  const isPublished = status === "published";
  const action = toggleMaterialStatus.bind(null, id, status);

  return (
    <Tooltip>
      <TooltipTrigger render={<div />}>
        <form action={action}>
          <ToggleButton isPublished={isPublished} />
        </form>
      </TooltipTrigger>
      <TooltipContent side="left">
        {isPublished ? "Снять с публикации" : "Опубликовать"}
      </TooltipContent>
    </Tooltip>
  );
}
