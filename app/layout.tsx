import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "50kb.lol",
  description:
    "Opinionated image compressor that forces images under 50KB across multiple formats.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  keywords: [
    "image compressor",
    "image compressor online",
    "image compressor free",
    "image compressor tool",
    "image compressor app",
    "image compressor software",
    "image compressor online free",
    "image compressor online tool",
    "image compressor online app",
    "image compressor online software",
    "50kb.lol",
    "50kb",
    "50kb image compressor",
    "50kb image compressor online",
    "50kb image compressor free",
    "50kb image compressor tool",
    "50kb image compressor app",
    "50kb image compressor software",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2642908073199820"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors />
        <Analytics />
      </body>
    </html>
  );
}
