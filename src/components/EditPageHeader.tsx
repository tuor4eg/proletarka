import { ExternalLink } from "lucide-react";
import { BackButton } from "@/components/BackButton";

type Props = {
  publicUrl?: string;
  isPublished?: boolean;
};

export function EditPageHeader({ publicUrl, isPublished }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <BackButton />
      {publicUrl && (
        isPublished ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
          >
            На сайте
            <ExternalLink size={13} />
          </a>
        ) : (
          <span
            title="Черновик — страница недоступна публично"
            className="flex items-center gap-1.5 text-sm text-gray-300 cursor-not-allowed select-none"
          >
            На сайте
            <ExternalLink size={13} />
          </span>
        )
      )}
    </div>
  );
}
