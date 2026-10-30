"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorActionButton } from "@/components/errors/ErrorActionButton";
import { ScanlineCode } from "@/components/errors/ScanlineCode";
import { resolveErrorScreen, type ErrorAction } from "@/lib/errors/error-screens";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type ErrorScreenProps = {
  code: number;
  /** Chamado pela ação "Tentar de novo"; sem ele, a página é recarregada. */
  onRetry?: () => void;
  /** Código de referência do erro (o `digest` do Next), mostrado nos erros do servidor para o suporte. */
  reference?: string;
  /** Ocupa a janela inteira (fora do painel); sem isso, preenche só a área de conteúdo. */
  full?: boolean;
};

/** Tela de erro: o código em linhas laranja, o texto do código, o que fazer e as saídas, tudo centralizado. */
export function ErrorScreen({ code, onRetry, reference, full = false }: ErrorScreenProps) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const info = resolveErrorScreen(code) ?? resolveErrorScreen(500)!;
  const [wait, setWait] = useState(info.retryAfter ?? 0);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const rise = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: EASE },
        };

  function renderAction(action: ErrorAction, primary: boolean) {
    if (action === "retry")
      return (
        <ErrorActionButton key={action} primary={primary} disabled={wait > 0} onClick={onRetry ?? (() => router.refresh())}>
          {wait > 0 ? `Tentar de novo em ${wait}s` : "Tentar de novo"}
        </ErrorActionButton>
      );
    if (action === "back")
      return (
        <ErrorActionButton key={action} primary={primary} onClick={() => router.back()}>
          Voltar
        </ErrorActionButton>
      );
    if (action === "login")
      return (
        <ErrorActionButton key={action} primary={primary} href="/login">
          {code === 403 ? "Entrar com outra conta" : "Entrar novamente"}
        </ErrorActionButton>
      );
    return (
      <ErrorActionButton key={action} primary={primary} href="/dashboard">
        Ir ao painel
      </ErrorActionButton>
    );
  }

  return (
    <div
      role={code >= 500 ? "alert" : undefined}
      className={cn("flex items-center px-6 py-16", full ? "min-h-screen bg-canvas" : "min-h-[60vh]")}
    >
      <div className="mx-auto w-full max-w-3xl space-y-8 text-center">
        <ScanlineCode code={code} reduced={reduced} />

        <motion.div className="mx-auto max-w-md space-y-2" {...rise(0.9)}>
          <h1 className="text-title">{info.title}</h1>
          <p className="text-body text-ink-soft">{info.message}</p>
          {info.hint && <p className="text-caption text-ink-faint">{info.hint}</p>}
        </motion.div>

        <motion.div className="flex flex-wrap justify-center gap-2" {...rise(1.05)}>
          {info.actions.map((action, index) => renderAction(action, index === 0))}
        </motion.div>

        {reference && code >= 500 && (
          <motion.p className="text-caption tabular-nums text-ink-faint" {...rise(1.2)}>
            Referência: {reference}
          </motion.p>
        )}
      </div>
    </div>
  );
}
