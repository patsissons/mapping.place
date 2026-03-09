const DEFAULT_SITE_URL = "https://mapping.place";

export const siteConfig = {
  name: "mapping.place",
  title: "Build richer place maps people can actually use fast",
  description:
    "Create shareable collections of restaurants, cafes, and stops with notes, filters, and live map context, then open the app to start plotting.",
  ctaLabel: "Open the app",
  ogImage: {
    width: 1200,
    height: 630,
  },
  icon: {
    size: 512,
    appleSize: 180,
  },
  colors: {
    background: "#f7f2e9",
    surface: "#fffaf2",
    foreground: "#143342",
    primary: "#0f7d78",
    primarySoft: "#d9f2ec",
    accent: "#ff9b3b",
    accentSoft: "#ffe0bc",
    line: "#d9d2c4",
    cardLine: "#d9d8d0",
    shadow: "#16303c1f",
    deep: "#102834",
    muted: "#58707b",
  },
  url: DEFAULT_SITE_URL,
} as const;

export function getSiteUrl() {
  const candidate = process.env.NEXT_PUBLIC_APP_URL ?? siteConfig.url;

  try {
    return new URL(candidate);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}
