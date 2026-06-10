import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AiAssistant } from "@/components/ai/ai-assistant";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="grain min-h-full flex flex-col">
        <SiteHeader />
        <main className="relative z-[2] flex-1">{children}</main>
        <SiteFooter />
        <AiAssistant />
      </body>
    </html>
  );
}
