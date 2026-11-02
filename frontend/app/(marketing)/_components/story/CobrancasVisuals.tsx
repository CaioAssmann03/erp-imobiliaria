"use client";

import { motion, useInView } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";
import boleto from "@/public/marketing/cobrancas/boleto-exemplo.png";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Uma faixa fina nas linhas laranja do site (3 px de cor, 1 de vão, cinco linhas), de uma ponta à outra da coluna: o
 * detalhe discreto de *Emitir o mês*. Ao chegar à tela, abre da esquerda para a direita como uma cortina. Parada no modo leve.
 */
export function ScanBand({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useLite();
  const shown = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const on = shown || still;
  return (
    <div ref={ref} aria-hidden className={cn("h-5 w-full", className)}>
      <motion.div
        initial={false}
        animate={{ clipPath: on ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
        transition={{ duration: still ? 0 : 1.4, ease: EASE }}
        className="size-full"
        style={{ backgroundImage: "repeating-linear-gradient(to bottom, var(--color-brand) 0, var(--color-brand) 3px, transparent 3px, transparent 4px)" }}
      />
    </div>
  );
}

/**
 * Um boleto de verdade, só para exemplificar (a imagem é um exemplo de domínio público, com dados fictícios, sem a faixa do
 * logotipo do banco): quando chega à tela, levanta de uma posição deitada até ficar de frente, com um respiro de sombra.
 */
export function RealBoleto({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useLite();
  const shown = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const on = shown || still;
  return (
    <figure ref={ref} className={cn("m-0", className)} style={{ perspective: 1400 }}>
      <motion.div
        initial={false}
        animate={{ opacity: on ? 1 : 0, y: on ? 0 : 70, rotateX: on ? 0 : 38 }}
        transition={{ duration: still ? 0 : 1.4, ease: EASE }}
        style={{ transformOrigin: "50% 100%" }}
      >
        {/* A faixa de cima da imagem (o logotipo do banco e a linha digitável) fica de fora: 42 dos 407 px. */}
        <div className="relative aspect-[682/365] w-full overflow-hidden bg-white shadow-float ring-1 ring-ink/10">
          <Image
            src={boleto}
            alt="Exemplo de boleto bancário: local de pagamento, vencimento, valor, dados do pagador e código de barras"
            sizes="(min-width: 768px) 672px, 100vw"
            className="absolute left-0 block w-full"
            style={{ top: `${(-42 / 365) * 100}%` }}
          />
        </div>
      </motion.div>
      <figcaption className="mt-4 text-label text-ink-faint">exemplo de boleto</figcaption>
    </figure>
  );
}
