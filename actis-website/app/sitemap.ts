import { MetadataRoute } from "next";

const BASE = "https://actis.world";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/start",
    "/spec",
    "/schemas",
    "/vectors",
    "/governance",
    "/ip",
    "/github",
  ];
  return routes.map((path) => ({
    url: path ? `${BASE}${path}` : BASE,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
}
