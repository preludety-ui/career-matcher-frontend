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
  title: "YELMA — Carrière Propulse",
  description: "La plateforme carrière pour les jeunes que le marché du travail oublie trop souvent",
  manifest: "/manifest.json",
  themeColor: "#FF7043",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YELMA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF7043" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="YELMA" />
        <script dangerouslySetInnerHTML={{
  __html: `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js');
      });
    }
  `
}} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}