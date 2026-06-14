import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { dirFor } from "@/lib/i18n/locales";
import "./globals.css";

// Nordic Frost uses Manrope for both display and body.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://blueroute.example.com"),
  title: {
    default: "Blue Route Logistics — Intelligent Global Shipping",
    template: "%s · Blue Route Logistics",
  },
  description:
    "AI-powered door-to-door container shipping to and from any country, plus premium warehouse leasing. Predictive ETAs, proactive risk mitigation, and unmatched reliability.",
  keywords: [
    "container shipping",
    "ocean freight",
    "FCL",
    "LCL",
    "door to door logistics",
    "warehouse leasing",
    "AI logistics",
    "predictive ETA",
    "supply chain",
  ],
  authors: [{ name: "Blue Route Logistics" }],
  openGraph: {
    type: "website",
    title: "Blue Route Logistics — Intelligent Global Shipping",
    description:
      "AI-powered precision for global container shipping and warehouse leasing.",
    siteName: "Blue Route Logistics",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blue Route Logistics",
    description: "Intelligent Global Shipping. AI-Powered Precision.",
  },
  // Tab icon is provided by the src/app/icon.svg file convention (Next 16).
};

export const viewport: Viewport = {
  themeColor: "#f7f9fc",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={dirFor(locale)}
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="grain min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
