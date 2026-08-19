import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://perfume-synapse.vercel.app"),
  title: "SYNAPSE DIGITAL",
  description: "Fragancias originales seleccionadas para quienes buscan calidad, estilo y distinción.",
  openGraph: {
    type: "website",
    siteName: "SYNAPSE DIGITAL",
    title: "SYNAPSE DIGITAL",
    description: "Fragancias árabes originales para quienes buscan calidad, estilo y distinción.",
    url: "https://perfume-synapse.vercel.app",
    locale: "es_PY",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SYNAPSE DIGITAL - Fragancias árabes originales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SYNAPSE DIGITAL",
    description: "Fragancias árabes originales para quienes buscan calidad, estilo y distinción.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
        <Analytics />
      </body>
    </html>
  );
}
