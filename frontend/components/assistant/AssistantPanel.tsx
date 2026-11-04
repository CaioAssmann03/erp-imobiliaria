"use client";

import { ArrowRight, ArrowUp, X } from "lucide-react";
import { useMotionValue, useSpring, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { AssistantMascot } from "@/components/brand/AssistantMascot";
import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

import { ASSISTANT_COPY, ASSISTANT_QUESTION_MAX_LENGTH } from "./assistant-copy";
import type { AssistantConversation } from "./useAssistantConversation";

/** O quanto do olho a pálpebra de baixo cobre nas respostas: o olhar calmo, meio cortado por baixo (a de cima passaria por bravo). */
const ANSWER_LIDS = 0.38;

/**
 * Uma mensagem do assistente: o personagem pequeno e quieto à esquerda, como se fosse ele quem a mandou, e o conteúdo ao lado.
 * `lids` é o quanto do olho a pálpebra de baixo cobre: nas respostas, o olhar calmo (cortado por baixo); enquanto pensa, os olhos bem abertos.
 */
function AssistantRow({ eyeX, eyeY, lids, children }: { eyeX: MotionValue<number>; eyeY: MotionValue<number>; lids: number; children: React.ReactNode }) {
  return (
    <div className="flex max-w-[94%] items-start gap-3">
      <AssistantMascot quiet eyeX={eyeX} eyeY={eyeY} lids={lids} legs={false} talking={false} className="mt-0.5 w-6 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Três pontos que pulsam enquanto a resposta não chega (o modo leve já corta animações em CSS; o texto fica para leitores de tela). */
function Thinking() {
  return (
    <div className="flex h-6 items-center gap-1">
      <span className="sr-only">{ASSISTANT_COPY.thinking}</span>
      {[0, 150, 300].map((delay) => (
        <span key={delay} aria-hidden style={{ animationDelay: `${delay}ms` }} className="size-1.5 animate-pulse rounded-badge bg-ink-faint" />
      ))}
    </div>
  );
}

/**
 * O painel do chat, encaixado na lateral direita e com a altura inteira da tela (por cima da página, sem flutuar; quem o posiciona é
 * `AssistantChat`). Limpo e sem caixas demais: no cabeçalho, o título, uma linha de apoio e o X; a conversa no fundo claro do painel,
 * com a pergunta num balão cinza à direita e a resposta como texto corrido à esquerda, sem balão, ao lado do personagem pequeno e
 * quieto, como se fosse ele quem a mandou (ele olha para cima enquanto a resposta não chega); o campo de envio e, embaixo, o aviso de dados sensíveis sempre à vista. Sem conversa ainda,
 * três perguntas de exemplo, uma por linha, que se enviam com um clique. Texto puro, nunca HTML.
 */
export function AssistantPanel({ conversation, onClose, className }: { conversation: AssistantConversation; onClose: () => void; className?: string }) {
  const { messages, error, isPending, ask } = conversation;
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // O personagem das mensagens: olha de frente e, enquanto a resposta não chega, para cima e para o lado, como quem pensa.
  const lookX = useMotionValue(0);
  const lookY = useMotionValue(0);
  const eyeX = useSpring(lookX, { stiffness: 170, damping: 20 });
  const eyeY = useSpring(lookY, { stiffness: 170, damping: 20 });
  // O olhar das respostas já entregues: de frente e um pouco para cima, com o pé dos olhos meio coberto.
  const gazeX = useMotionValue(0);
  const gazeY = useMotionValue(-0.15);
  const lite = useLite();
  useEffect(() => {
    // No modo leve ele olha sempre de frente.
    lookX.set(isPending && !lite ? 0.55 : 0);
    lookY.set(isPending && !lite ? -0.6 : 0);
  }, [isPending, lite, lookX, lookY]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, isPending]);

  function submit() {
    const question = draft.trim();
    if (question && !isPending) ask(question, () => setDraft(""));
  }

  return (
    <div
      role="dialog"
      aria-label={ASSISTANT_COPY.title}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
      className={cn(
        "flex h-dvh w-full flex-col overflow-hidden bg-surface text-ink shadow-drawer animate-in duration-200 slide-in-from-right sm:w-112",
        className,
      )}
    >
      <header className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-heading">{ASSISTANT_COPY.title}</h2>
          <p className="text-caption text-ink-soft">{ASSISTANT_COPY.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={ASSISTANT_COPY.close}
          className="-mr-2 grid size-9 shrink-0 place-items-center rounded-button text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <div ref={listRef} aria-live="polite" className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        {messages.length === 0 && !isPending && (
          <div className="space-y-5 pt-4">
            <div className="space-y-1">
              <p className="text-title">{ASSISTANT_COPY.welcome}</p>
              <p className="text-body text-ink-soft">{ASSISTANT_COPY.welcomeHint}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {ASSISTANT_COPY.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion, () => undefined)}
                  className="group flex items-center justify-between gap-3 rounded-panel bg-surface-muted px-4 py-3 text-left text-body transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                >
                  {suggestion}
                  <ArrowRight className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <p key={message.id} className="ml-auto w-fit max-w-[85%] rounded-panel bg-surface-muted px-4 py-2.5 text-body whitespace-pre-wrap">
              {message.text}
            </p>
          ) : (
            <AssistantRow key={message.id} eyeX={gazeX} eyeY={gazeY} lids={ANSWER_LIDS}>
              <p className="text-body leading-relaxed whitespace-pre-wrap">{message.text}</p>
            </AssistantRow>
          ),
        )}

        {isPending && (
          <AssistantRow eyeX={eyeX} eyeY={eyeY} lids={0}>
            <Thinking />
          </AssistantRow>
        )}
        {error && (
          <p role="alert" className="rounded-panel bg-danger-soft px-4 py-2.5 text-caption text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="px-4 pt-2 pb-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="flex items-end gap-1 rounded-control bg-surface-muted p-1.5 focus-within:ring-2 focus-within:ring-brand/40">
            <textarea
              autoFocus
              rows={1}
              value={draft}
              maxLength={ASSISTANT_QUESTION_MAX_LENGTH}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              aria-label={ASSISTANT_COPY.placeholder}
              placeholder={ASSISTANT_COPY.placeholder}
              className="max-h-28 min-h-8 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-body [field-sizing:content] outline-none placeholder:text-ink-faint"
            />
            <button
              type="submit"
              disabled={isPending || draft.trim() === ""}
              aria-label={ASSISTANT_COPY.send}
              className="grid size-8 shrink-0 place-items-center rounded-button bg-brand text-brand-foreground transition-colors hover:bg-brand-strong disabled:bg-surface-sunken disabled:text-ink-faint"
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
          </div>
        </form>
        <p className="mt-3 px-1 text-caption text-ink-faint">{ASSISTANT_COPY.notice}</p>
      </div>
    </div>
  );
}
