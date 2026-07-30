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

export const metadata: Metadata = {
  title: "Magic AI — Chat. Generate. Publish.",
  description:
    "Magic AI builds custom websites in minutes. Chat with OpenAI or Gemini, refine live, and publish with one click.",
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
