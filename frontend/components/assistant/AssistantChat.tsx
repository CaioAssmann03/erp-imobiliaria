"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useRef } from "react";

import { ASSISTANT_COPY } from "./assistant-copy";
import { AssistantPanel } from "./AssistantPanel";
import { useAssistantConversation } from "./useAssistantConversation";
import { useAssistantEnabled } from "./use-assistant-enabled";
import { useAssistantOpen } from "./use-assistant-open";

/**
 * O assistente de ajuda do ERP: um botão escuro com a palavra "Ajuda" no canto inferior direito da tela (só de `lg` para cima: no celular ele
 * não aparece, para não atrapalhar, e a linha "Ajuda" do menu lateral, `MobileMenu`, abre a mesma janela) e, ao clicar, o painel encaixado na lateral direita, com a altura inteira da tela, por cima do botão. Só
 * existe para quem está logado (não há assistente nas páginas públicas) e a pessoa pode desligá-lo em Configurações → Assistente
 * (`useAssistantEnabled`): desligado, nem o botão nem a janela são desenhados.
 */
export function AssistantChat() {
  const [isEnabled] = useAssistantEnabled();
  const [isOpen, setIsOpen] = useAssistantOpen();
  // A conversa fica aqui, não no painel: fechar o painel não a apaga (ela dura enquanto a tela do ERP está aberta).
  const conversation = useAssistantConversation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Ao sair do ERP a janela não fica "aberta" para a próxima vez que o shell montar.
  useEffect(() => () => setIsOpen(false), [setIsOpen]);

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
        className="fixed right-4 bottom-4 z-40 hidden h-11 items-center gap-2 rounded-button bg-ink px-4 text-body font-medium text-ink-foreground shadow-float transition-colors hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none lg:right-8 lg:flex"
      >
        <MessageCircle className="size-4" aria-hidden />
        {ASSISTANT_COPY.trigger}
      </button>
    </>
  );
}
