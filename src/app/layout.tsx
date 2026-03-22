import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { NavigationProgress } from "@/components/NavigationProgress";

export const metadata: Metadata = {
  title: "Музей завода «Пролетарская Свобода»",
  description: "Люди, события и находки из истории завода",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Suspense>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
