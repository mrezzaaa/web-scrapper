import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadMaps – Google Maps Lead Generator untuk UMKM",
  description:
    "Scraper Google Maps untuk menemukan UMKM tanpa website. Temukan prospek bisnis, hubungi mereka via WhatsApp, dan tingkatkan penjualan jasa pembuatan website Anda.",
  keywords: ["lead generation", "google maps scraper", "UMKM", "website", "Indonesia"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
