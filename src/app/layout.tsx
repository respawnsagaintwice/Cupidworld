import type { Metadata, Viewport } from "next";
import { Mochiy_Pop_One, Fredoka, Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const mochiyPopOne = Mochiy_Pop_One({
  variable: "--font-mochiy",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const baloo2 = Baloo_2({
  variable: "--font-baloo",
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Our Little World ♡ — A Private Scrapbook for Two",
  description: "A private digital home for two people to preserve photos, memories, love notes, and milestones together forever.",
  keywords: ["couples scrapbook", "private memory book", "cute couple app", "romantic diary", "relationship milestone tracker"],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF9F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${mochiyPopOne.variable} ${fredoka.variable} ${baloo2.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full font-nunito text-brand-dark bg-brand-cream selection:bg-brand-soft-pink selection:text-brand-dark flex flex-col relative overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
