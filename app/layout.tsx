import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATA — Achat Tombola Afrique",
  description: "Plateforme de jeux concours QCM et tombolas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=999" />
        <link rel="shortcut icon" href="/favicon.ico?v=999" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}