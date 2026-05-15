import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://ata-macls-projects-ed759868.vercel.app'

export const metadata: Metadata = {
  title: "ATA — Achat Tombola Afrique",
  description: "Participez aux concours QCM et tombolas organisés par les entreprises africaines.",
  openGraph: {
    title: "ATA — Achat Tombola Afrique",
    description: "Participez aux concours QCM et tombolas organisés par les entreprises africaines.",
    url: BASE_URL,
    siteName: "ATA — Achat Tombola Afrique",
    images: [
      {
        url: `${BASE_URL}/icons/icon-512x512.png`,
        width: 512,
        height: 512,
        alt: "ATA — Achat Tombola Afrique",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ATA — Achat Tombola Afrique",
    description: "Participez aux concours QCM et tombolas organisés par les entreprises africaines.",
    images: [`${BASE_URL}/icons/icon-512x512.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon2.ico?v=1" />
        <link rel="shortcut icon" href="/favicon2.ico?v=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1B3A6B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js');
            });
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}