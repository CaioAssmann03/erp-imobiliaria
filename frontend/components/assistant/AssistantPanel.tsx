"use client";

import { ArrowUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { ASSISTANT_COPY, ASSISTANT_QUESTION_MAX_LENGTH } from "./assistant-copy";
import type { AssistantConversation } from "./useAssistantConversation";

/** A resposta: um balão branco sobre o cinza da conversa, com a sombra leve dos cartões do painel. */
const ANSWER_BUBBLE = "max-w-[88%] rounded-panel bg-surface px-3.5 py-2.5 text-body whitespace-pre-wrap shadow-card";

/** Três pontos que pulsam enquanto a resposta não chega (o modo leve já corta animações em CSS; o texto fica para leitores de tela). */
function Thinking() {
  return (
    <div className={cn(ANSWER_BUBBLE, "flex w-fit items-center gap-1 py-3.5")}>
      <span className="sr-only">{ASSISTANT_COPY.thinking}</span>
      {[0, 150, 300].map((delay) => (
        <span key={delay} aria-hidden style={{ animationDelay: `${delay}ms` }} className="size-1.5 animate-pulse rounded-badge bg-ink-faint" />
      ))}
    </div>
  );
}

/**
 * O painel do chat, encaixado na lateral direita e com a altura inteira da tela (por cima da página, sem flutuar; quem o posiciona é `AssistantChat`): um cabeçalho claro (título, uma linha de apoio e o X, como o das Configurações), a conversa sobre o cinza
 * `surface-muted` (a pergunta num balão com um tom suave da cor de destaque à direita, a resposta num balão branco à esquerda), o campo de envio e, embaixo, o aviso de
 * dados sensíveis sempre à vista. Sem conversa ainda, três perguntas de exemplo que se enviam com um clique. Texto puro, nunca HTML.
 */
export function AssistantPanel({ conversation, onClose, className }: { conversation: AssistantConversation; onClose: () => void; className?: string }) {
  const { messages, error, isPending, ask } = conversation;
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

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
        "flex h-dvh w-full flex-col overflow-hidden bg-surface text-ink shadow-float animate-in duration-200 slide-in-from-right sm:w-112",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <h2 className="text-title">{ASSISTANT_COPY.title}</h2>
          <p className="mt-0.5 text-body text-ink-soft">{ASSISTANT_COPY.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={ASSISTANT_COPY.close}
          className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-button text-ink-soft transition-colors hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>

      <div ref={listRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-surface-muted px-5 py-4">
        {messages.length === 0 && !isPending && (
          <div className="space-y-4">
            <div className="space-y-0.5">
              <p className="text-heading">{ASSISTANT_COPY.welcome}</p>
              <p className="text-body text-ink-soft">{ASSISTANT_COPY.welcomeHint}</p>
            </div>
            <div className="flex flex-col gap-2">
              {ASSISTANT_COPY.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion, () => undefined)}
                  className="rounded-panel bg-surface px-4 py-2.5 text-left text-body shadow-card transition-colors hover:bg-surface-sunken focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <p key={message.id} className="ml-auto w-fit max-w-[88%] rounded-panel bg-brand-soft px-3.5 py-2.5 text-body whitespace-pre-wrap">
              {message.text}
            </p>
          ) : (
            <p key={message.id} className={ANSWER_BUBBLE}>
              {message.text}
            </p>
          ),
        )}

        {isPending && <Thinking />}
        {error && (
          <p role="alert" className="rounded-panel bg-danger-soft px-3.5 py-2.5 text-caption text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="bg-surface px-4 pt-3 pb-3.5">
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
        <p className="mt-2.5 px-1 text-caption text-ink-soft">{ASSISTANT_COPY.notice}</p>
      </div>
    </div>
  );
}
