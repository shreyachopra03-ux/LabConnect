import type { Metadata, Viewport } from "next";
import { DM_Serif_Display } from "next/font/google";
import { getLang } from "@/lib/i18n";
import "./globals.css";

// One display face, Latin only (~20 KB, self-hosted by Next). Telugu and Devanagari
// headings fall back to the phone's own fonts, so pages stay light on weak data.
const display = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Company A Diagnostics — Reports",
  description: "Your lab results, delivered safely and explained in English, Telugu and Hindi.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1d1a16" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={await getLang()} className={display.variable}>
      <body>{children}</body>
    </html>
  );
}
