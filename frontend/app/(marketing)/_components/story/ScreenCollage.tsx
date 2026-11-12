"use client";

import { AnimatePresence, motion, useInView, useScroll, useTransform } from "motion/react";
import { type StaticImageData } from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { useLite } from "@/lib/theme/use-lite";
import { ThemedImage } from "@/app/(marketing)/_components/ThemedImage";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** As duas telas do exemplo: a maior, ao fundo, e a menor, à frente. */
export type CollageScreens = readonly [
  { image: StaticImageData; dark: StaticImageData; alt: string },
  { image: StaticImageData; dark: StaticImageData; alt: string },
];

const FRAME = "block w-full bg-surface shadow-float ring-1 ring-ink/10";

/** A tela ampliada, por cima da página: fecha com o X, com Esc ou com um clique em qualquer lugar. Vai para o `body` para não herdar as transformações da rolagem. */
function Lightbox({ screens, index, onClose, still }: { screens: CollageScreens; index: number | null; onClose: () => void; still: boolean }) {
  // Só existe `document` no navegador: no servidor (e na hidratação) o painel não é desenhado.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const overlay = useRef<HTMLDivElement>(null);
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // A página atrás fica parada enquanto a tela está aberta (a rolagem suave a deixaria correr por baixo).
    const element = overlay.current;
    const stop = (event: Event) => event.preventDefault();
    element?.addEventListener("wheel", stop, { passive: false });
    element?.addEventListener("touchmove", stop, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      element?.removeEventListener("wheel", stop);
      element?.removeEventListener("touchmove", stop);
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="lightbox"
          ref={overlay}
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label="Tela do sistema ampliada"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: still ? 0 : 0.3 }}
          onClick={onClose}
          className="theme-public fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-canvas/95 p-4 md:p-10"
        >
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="absolute top-4 right-4 inline-flex h-9 items-center border border-ink/20 px-4 text-label text-ink transition-colors hover:bg-ink/5 md:top-6 md:right-6"
          >
            Fechar
          </button>
          <motion.div
            initial={{ scale: still ? 1 : 0.95, y: still ? 0 : 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: still ? 1 : 0.97 }}
            transition={{ duration: still ? 0 : 0.5, ease: EASE }}
            className="w-[min(94vw,calc(88svh*1.6))]"
          >
            <ThemedImage light={screens[index].image} dark={screens[index].dark} alt={screens[index].alt} sizes="94vw" className={FRAME} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Client Component: um exemplo rápido do sistema, só com imagens: duas telas reais (as unidades e o painel) sobrepostas, uma
 * maior e outra menor à frente, que andam em ritmos diferentes com a rolagem. Um clique em qualquer uma a amplia por cima da
 * página, para olhar com calma. Dados fictícios (`seed_demo`). Sem movimento para quem prefere menos movimento.
 */
export function ScreenCollage({ screens, className }: { screens: CollageScreens; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useLite();
  const shown = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const on = shown || still;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const mainY = useTransform(scrollYProgress, [0, 1], [36, -36]);
  const frontY = useTransform(scrollYProgress, [0, 1], [-70, 70]);
  const [open, setOpen] = useState<number | null>(null);

  const button = (index: number) => (
    <button
      type="button"
      onClick={() => setOpen(index)}
      aria-label={`Ampliar: ${screens[index].alt}`}
      className="group relative block w-full cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <ThemedImage light={screens[index].image} dark={screens[index].dark} alt={screens[index].alt} sizes={index === 0 ? "(min-width: 1024px) 900px, 90vw" : "(min-width: 1024px) 460px, 46vw"} className={FRAME} />
      <span aria-hidden className="absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/5" />
    </button>
  );

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <div className="relative mx-auto mb-[16%] w-full max-w-5xl sm:mb-[10%]">
        <motion.div
          style={still ? undefined : { y: mainY }}
          initial={false}
          animate={{ opacity: on ? 1 : 0, clipPath: on ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
          transition={{ duration: still ? 0 : 1.1, ease: EASE }}
          className="relative w-[88%]"
        >
          {button(0)}
        </motion.div>

        <motion.div
          style={still ? undefined : { y: frontY }}
          initial={false}
          animate={{ opacity: on ? 1 : 0, x: on ? 0 : 40 }}
          transition={{ duration: still ? 0 : 1, delay: still ? 0 : 0.35, ease: EASE }}
          className="absolute right-0 -bottom-[14%] z-10 w-[46%]"
        >
          {button(1)}
        </motion.div>
      </div>

      <Lightbox screens={screens} index={open} onClose={() => setOpen(null)} still={still} />
    </div>
  );
}
