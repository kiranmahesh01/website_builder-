import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, Syne } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const brand = Instrument_Serif({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const siteUrl =
  process.env.AUTH_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://websitebuilder-main.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Magic AI — Your business in a sentence. Your website in minutes.",
    template: "%s · Magic AI",
  },
  description:
    "Free AI website builder. Describe your business, pick a UI kit, preview instantly, and publish — no code or API keys required.",
  keywords: [
    "AI website builder",
    "no-code website",
    "free website generator",
    "small business website",
    "landing page builder",
    "Magic AI",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Magic AI",
    title: "Magic AI — Your business in a sentence. Your website in minutes.",
    description:
      "Free AI website builder. Describe your business, preview instantly, publish in one click.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Magic AI — free AI website builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Magic AI — Your business in a sentence. Your website in minutes.",
    description:
      "Free AI website builder. No code. No API keys. Publish in one click.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${body.variable} ${display.variable} ${brand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-fog">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
