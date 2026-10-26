import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Os tamanhos de texto do design system (`app/globals.css`) são classes `text-*` que o tailwind-merge
 * não conhece: sem isso, ele os trata como cor e descarta `text-body` ao lado de `text-ink`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "title", "heading", "body", "caption", "hero", "section", "label"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
