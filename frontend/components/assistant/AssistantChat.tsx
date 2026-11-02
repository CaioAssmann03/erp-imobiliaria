"use client";

import { MessageCircle } from "lucide-react";
import { useRef, useState } from "react";

import { ASSISTANT_COPY } from "./assistant-copy";
import { AssistantPanel } from "./AssistantPanel";
import { useAssistantConversation } from "./useAssistantConversation";
import { useAssistantEnabled } from "./use-assistant-enabled";

/**
 * O assistente de ajuda do ERP: um botão escuro com a palavra "Ajuda" no canto inferior direito da tela e, ao clicar, o painel encaixado na lateral direita, com a altura inteira da tela, por cima do botão. Só
 * existe para quem está logado (não há assistente nas páginas públicas) e a pessoa pode desligá-lo em Configurações → Assistente
 * (`useAssistantEnabled`): desligado, nem o botão nem a janela são desenhados.
 */
export function AssistantChat() {
  const [isEnabled] = useAssistantEnabled();
  const [isOpen, setIsOpen] = useState(false);
  // A conversa fica aqui, não no painel: fechar o painel não a apaga (ela dura enquanto a tela do ERP está aberta).
  const conversation = useAssistantConversation();
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!isEnabled) return null;

  function close() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      {isOpen && <AssistantPanel conversation={conversation} onClose={close} className="fixed inset-y-0 right-0 z-50" />}
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? ASSISTANT_COPY.close : ASSISTANT_COPY.open}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        className="fixed right-4 bottom-4 z-40 flex h-11 items-center gap-2 rounded-button bg-ink px-4 text-body font-medium text-ink-foreground shadow-float transition-colors hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none lg:right-8"
      >
        <MessageCircle className="size-4" aria-hidden />
        {ASSISTANT_COPY.trigger}
      </button>
    </>
  );
}
