import type { Metadata, Viewport } from "next";

import "leaflet/dist/leaflet.css";
import "@/app/globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { getSiteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/icon"],
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    url: "/",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/opengraph-image",
        width: siteConfig.ogImage.width,
        height: siteConfig.ogImage.height,
        alt: `${siteConfig.name} preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.colors.primary,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-body text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
