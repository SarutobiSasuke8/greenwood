import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getChain } from "@/lib/data";
import { SITE } from "@/lib/site";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display", display: "swap" });
const body = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600"], style: ["normal", "italic"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} · Robinhood Chain game index`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website", title: SITE.name, description: SITE.description },
  twitter: { card: "summary", title: SITE.name, description: SITE.description },
  robots: { index: true, follow: true },
};

export const revalidate = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const chain = await getChain().catch(() => null);
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <SiteHeader chain={chain} />
        <main id="main">{children}</main>
        <SiteFooter chain={chain} />
      </body>
    </html>
  );
}
