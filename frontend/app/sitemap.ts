import type { MetadataRoute } from "next";

import { PUBLIC_PAGES } from "@/lib/site/public-pages";
import { absoluteUrl } from "@/lib/site/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PAGES.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(path),
    changeFrequency,
    priority,
  }));
}
