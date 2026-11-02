import type { MetadataRoute } from "next";

import { PRIVATE_PATHS } from "@/lib/site/public-pages";
import { absoluteUrl } from "@/lib/site/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PRIVATE_PATHS] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
