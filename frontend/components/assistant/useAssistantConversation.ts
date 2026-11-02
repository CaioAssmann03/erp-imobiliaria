"use client";

import { useRef, useState } from "react";

import { useAssistantAskCreate } from "@/lib/api/generated/assistant/assistant";
import { apiErrorMessage } from "@/lib/errors/form-errors";

import { ASSISTANT_COPY } from "./assistant-copy";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

/** Quantas mensagens anteriores vão com cada pergunta (3 trocas): o limite do backend (spec 069, R13), que também define o custo de cada pergunta. */
const HISTORY_LIMIT = 6;

/**
 * A conversa de uma tela, só na memória (nada é guardado, nem no servidor). Cada pergunta vai com as últimas mensagens da conversa, para o
 * assistente entender um "e como faço isso?". A pergunta só entra na conversa quando a resposta chega: se for recusada (dado sensível,
 * limite), ela continua no campo para ser corrigida, e por isso o histórico enviado só tem trocas completas.
 */
export function useAssistantConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(0);
  const mutation = useAssistantAskCreate();

  function ask(question: string, onAnswered: () => void) {
    setError(null);
    mutation.mutate(
      { data: { question, history: messages.slice(-HISTORY_LIMIT).map(({ role, text }) => ({ author: role, content: text })) } },
      {
        onSuccess: ({ answer }) => {
          const first = nextId.current;
          nextId.current += 2;
          setMessages((current) => [
            ...current,
            { id: first, role: "user", text: question },
            { id: first + 1, role: "assistant", text: answer },
          ]);
          onAnswered();
        },
        onError: (failure) => setError(apiErrorMessage(failure, ASSISTANT_COPY.failed)),
      },
    );
  }

  return { messages, error, isPending: mutation.isPending, ask };
}

export type AssistantConversation = ReturnType<typeof useAssistantConversation>;
