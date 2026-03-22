"use client";

import { useState } from "react";

type Props = {
  action: () => Promise<void>;
  label?: string;
};

export function DeleteButton({ action, label = "Удалить" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto text-sm text-red-600 border border-red-200 rounded-xl px-4 py-2.5 hover:bg-red-50 transition-colors"
      >
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold mb-2">Удалить?</h2>
            <p className="text-sm text-gray-500 mb-6">Это действие нельзя отменить.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 text-sm font-medium border border-gray-200 rounded-xl px-4 py-2.5 hover:border-gray-400 transition-colors"
              >
                Отмена
              </button>
              <form action={action} className="flex-1">
                <button
                  type="submit"
                  className="w-full text-sm font-medium bg-red-600 text-white rounded-xl px-4 py-2.5 hover:bg-red-700 transition-colors"
                >
                  Удалить
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
