"use client";

import { motion } from "motion/react";
import Image from "next/image";

import { PHOTOS } from "./photos";
import type { GlobeLocation } from "./locations";

/**
 * Cartão de um condomínio do globo: foto (ilustrativa) vista pela persiana de linhas finas, como os prédios do hero,
 * e a cidade. Entra com uma cortina de cima para baixo; ao trocar de condomínio sai esmaecendo.
 */
export function LocationCard({ location }: { location: GlobeLocation }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 14, clipPath: "inset(0 0 100% 0)" }}
      animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="m-0 w-full max-w-60 rounded-sharp border border-ink/15 bg-surface p-2"
    >
      <div className="relative aspect-[7/5] overflow-hidden">
        <Image src={PHOTOS[location.photo]} alt="" unoptimized loading="eager" className="size-full object-cover" />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(to bottom, transparent 0, transparent 3px, var(--color-surface) 3px, var(--color-surface) 4px)",
          }}
        />
      </div>
      <figcaption className="flex items-baseline justify-between gap-3 px-1 pb-1 pt-3">
        <span className="text-body font-medium">{location.name}</span>
        <span className="text-label text-ink-faint">{location.region}</span>
      </figcaption>
    </motion.figure>
  );
}
