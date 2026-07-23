import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://boechat.company";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/sites`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/intake`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
