"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RevealInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** O que o olho mostra e esconde, para o rótulo do botão: "senha", "usuário". */
  subject: string;
  /**
   * Como esconder: `type` troca o tipo do campo para senha (o certo para uma senha, que os gerenciadores de senha reconhecem); `mask`
   * mantém o campo de texto e só pinta os caracteres como bolinhas, para o usuário não ser tomado por uma segunda senha.
   */
  hide: "type" | "mask";
  /** Começa escondido? (padrão: sim). */
  startHidden?: boolean;
}

/** Um campo com o olho: esconde o que se digita (bolinhas) e o mostra de novo com um clique. */
export function RevealInput({ subject, hide, startHidden = true, className, ...props }: RevealInputProps) {
  const [hidden, setHidden] = useState(startHidden);

  return (
    <div className="relative">
      <Input
        type={hide === "type" && hidden ? "password" : "text"}
        className={cn(className, "pr-11", hide === "mask" && hidden && "[-webkit-text-security:disc]")}
        {...props}
      />
      <button
        type="button"
        onClick={() => setHidden((current) => !current)}
        aria-label={hidden ? `Mostrar ${subject}` : `Ocultar ${subject}`}
        aria-pressed={!hidden}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-soft outline-none transition-colors hover:text-ink focus-visible:text-ink"
      >
        {hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
    </div>
  );
}
