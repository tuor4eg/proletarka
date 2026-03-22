"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/admin", label: "Материалы", exact: true },
  { href: "/admin/entities", label: "Карточки" },
  { href: "/admin/topics", label: "Темы" },
];

export function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-11 flex items-center gap-6">
        <span className="text-sm font-semibold text-gray-900 shrink-0">Админка</span>
        <div className="flex items-center gap-0.5 flex-1">
          {NAV_LINKS.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                isActive(href, exact)
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settings"
            className={`text-sm transition-colors ${
              pathname === "/admin/settings"
                ? "text-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Настройки
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Сайт
          </Link>
          <form action="/admin/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Выйти
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
