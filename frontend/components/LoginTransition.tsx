"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { HOUSE_LOGO_PATH } from "@/components/brand/HouseLogo";
import { onLoginTransition } from "@/lib/auth/login-transition";

const LOGO = { width: 1061.5, height: 1120.5 } as const;
const BANDS = 16;
/** Quanto o véu fica no mínimo (ms), para a animação do logo tocar até o fim, e o máximo (ms), caso o painel não abra. */
const MIN_VISIBLE_MS = 1700;
const MAX_VISIBLE_MS = 10000;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * O logo se monta de baixo para cima, em faixas horizontais que entram da esquerda (como as linhas dos prédios da home) e
 * depois respira devagar enquanto o painel carrega. Com menos movimento aparece inteiro, parado.
 */
function BuildingLogo({ still }: { still: boolean }) {
  const bandHeight = LOGO.height / BANDS;

  return (
    <motion.div
      animate={still ? undefined : { scale: [1, 1.035, 1] }}
      transition={{ delay: 1.3, duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox={`0 0 ${LOGO.width} ${LOGO.height}`} aria-hidden="true" className="size-24 text-brand sm:size-28">
        <defs>
          <clipPath id="login-transition-build">
            {Array.from({ length: BANDS }, (_, band) => (
              <motion.rect
                key={band}
                x={0}
                y={LOGO.height - (band + 1) * bandHeight}
                height={bandHeight + 1}
                initial={{ width: still ? LOGO.width : 0 }}
                animate={{ width: LOGO.width }}
                transition={{ duration: 0.5, delay: 0.15 + band * 0.04, ease: EASE }}
              />
            ))}
          </clipPath>
        </defs>
        <path d={HOUSE_LOGO_PATH} fill="currentColor" clipPath="url(#login-transition-build)" />
      </svg>
    </motion.div>
  );
}

/**
 * Tela de transição do login ao painel: depois de entrar, cobre a tela com o logo animado no centro e só sai (em fade)
 * quando a página já trocou e a animação teve tempo de tocar. Fica no layout raiz para sobreviver à troca de página.
 */
export function LoginTransition() {
  const pathname = usePathname();
  const still = useReducedMotion() ?? false;
  const [visible, setVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(
    () =>
      onLoginTransition(() => {
        shownAt.current = performance.now();
        setVisible(true);
      }),
    [],
  );

  // Sai quando a página trocou (já não é o login) e o tempo mínimo passou; e, por garantia, depois do máximo.
  useEffect(() => {
    if (!visible) return;
    const elapsed = performance.now() - shownAt.current;
    const wait = pathname !== "/login" ? Math.max(0, MIN_VISIBLE_MS - elapsed) : Math.max(0, MAX_VISIBLE_MS - elapsed);
    const timer = window.setTimeout(() => setVisible(false), wait);
    return () => window.clearTimeout(timer);
  }, [visible, pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="login-transition"
          role="status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas"
        >
          <span className="sr-only">Entrando…</span>
          <BuildingLogo still={still} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
