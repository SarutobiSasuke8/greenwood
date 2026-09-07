import type { MetadataRoute } from "next";
import { listRecords } from "@greenwood/core";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE.url}/contracts`, lastModified: now },
    { url: `${SITE.url}/method`, lastModified: now },
    { url: `${SITE.url}/developers`, lastModified: now },
    { url: `${SITE.url}/mcp`, lastModified: now },
    { url: `${SITE.url}/about`, lastModified: now },
    ...listRecords().map((r) => ({ url: `${SITE.url}/games/${r.id}`, lastModified: now, changeFrequency: "hourly" as const })),
  ];
}
