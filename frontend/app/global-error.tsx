"use client";

import "./globals.css";

import { ErrorScreen } from "@/components/errors/ErrorScreen";

/** Falha no layout raiz, antes de qualquer página: a tela 500 em janela inteira (substitui o <html>). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body>
        <ErrorScreen code={500} onRetry={reset} reference={error.digest} full />
      </body>
    </html>
  );
}
