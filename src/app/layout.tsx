import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { NavigationProgress } from "@/components/NavigationProgress";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="ru" className={cn("font-sans", geist.variable)}>
      <body>
        <Suspense>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
