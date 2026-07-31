import type { MetadataRoute } from "next";
import { FLAGS } from "./lib/flags";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://boechat.company";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    // Só entra no sitemap quando a página está no ar. Anunciar pro Google uma
    // rota que devolve 404 é erro de indexação de graça.
    ...(FLAGS.paginaSites
      ? [
          {
            url: `${base}/sites`,
            lastModified: now,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          },
        ]
      : []),
    { url: `${base}/intake`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
