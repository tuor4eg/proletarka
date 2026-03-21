import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
