"use client";

import { useState } from "react";

type Material = {
  id: number;
  title: string;
  summary: string | null;
  coverImagePath: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  sourceUrl: string | null;
};

type Props = {
  articles: Material[];
  photos: Material[];
  documents: Material[];
};

function YearRange({ yearFrom, yearTo }: { yearFrom: number | null; yearTo: number | null }) {
  if (!yearFrom && !yearTo) return null;
  const label = yearFrom === yearTo || !yearTo ? String(yearFrom) : `${yearFrom}–${yearTo}`;
  return <span className="text-xs text-gray-400">{label}</span>;
}

function ArticleList({ items }: { items: Material[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400">Нет статей.</p>;
  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {items.map((item) => (
        <div key={item.id} className="py-4">
          <div className="flex items-start gap-2 mb-1">
            <span className="text-sm font-medium flex-1">{item.title}</span>
            <YearRange yearFrom={item.yearFrom} yearTo={item.yearTo} />
          </div>
          {item.summary && <p className="text-sm text-gray-500">{item.summary}</p>}
        </div>
      ))}
    </div>
  );
}

function PhotoGrid({ items }: { items: Material[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400">Нет фотографий.</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-1">
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
            {item.coverImagePath ? (
              <img
                src={item.coverImagePath!}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                нет фото
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 leading-tight">{item.title}</p>
          <YearRange yearFrom={item.yearFrom} yearTo={item.yearTo} />
        </div>
      ))}
    </div>
  );
}

function DocumentList({ items }: { items: Material[] }) {
  if (items.length === 0) return <p className="text-sm text-gray-400">Нет документов.</p>;
  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {items.map((item) => (
        <div key={item.id} className="py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{item.title}</p>
            {item.summary && <p className="text-xs text-gray-500 mt-0.5">{item.summary}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <YearRange yearFrom={item.yearFrom} yearTo={item.yearTo} />
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2"
              >
                Источник
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PersonTabs({ articles, photos, documents }: Props) {
  const tabs = [
    { key: "articles", label: "Статьи", count: articles.length },
    { key: "photos", label: "Фото", count: photos.length },
    { key: "documents", label: "Документы", count: documents.length },
  ].filter((t) => t.count > 0);

  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? "articles");

  if (tabs.length === 0) {
    return <p className="text-sm text-gray-400 mt-6">Материалов пока нет.</p>;
  }

  return (
    <div className="mt-8">
      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}{" "}
            <span className={`text-xs ${activeTab === tab.key ? "text-gray-500" : "text-gray-400"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "articles" && <ArticleList items={articles} />}
      {activeTab === "photos" && <PhotoGrid items={photos} />}
      {activeTab === "documents" && <DocumentList items={documents} />}
    </div>
  );
}
