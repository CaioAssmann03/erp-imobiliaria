"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";

import { STEPS } from "@/app/(marketing)/_components/content";
import { Reveal } from "@/app/(marketing)/_components/motion/Reveal";

/** Passos numerados numa linha vertical que se preenche de laranja conforme o scroll. */
export function Steps() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  return (
    <ol ref={ref} className="relative flex max-w-2xl flex-col gap-12 pl-16">
      <span aria-hidden className="absolute top-1 bottom-1 left-[1.1rem] w-px bg-ink/15" />
      <motion.span
        aria-hidden
        style={{ scaleY, transformOrigin: "top" }}
        className="absolute top-1 bottom-1 left-[1.1rem] w-px bg-brand"
      />
      {STEPS.map((step, index) => (
        <li key={step.title} className="relative">
          <Reveal>
            <span className="absolute -left-16 flex h-6 w-9 items-center justify-center rounded-sharp bg-canvas text-label text-brand tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-title font-normal">{step.title}</h3>
            <p className="mt-2 text-body text-ink-soft">{step.description}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
