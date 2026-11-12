"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

import { ScanGlyph, type Glyph } from "@/app/(marketing)/contato/ScanGlyph";

const EASE = [0.22, 1, 0.36, 1] as const;

/** O ícone "assignment" do Material (uma prancheta com campos): o formulário. Desenhado em 24 × 24. */
const FORM: Glyph = {
  path: "M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
};

/** O balão do WhatsApp (24 × 24) e, recortado no meio, o ícone "phone" do Material. */
const WHATSAPP: Glyph = {
  path: "M12 1C5.925 1 1 5.925 1 12c0 2.01.54 3.9 1.48 5.52L1 23l5.62-1.45A10.95 10.95 0 0 0 12 23c6.075 0 11-4.925 11-11S18.075 1 12 1z",
  hole: {
    path: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
    transform: { x: 4.6, y: 4.4, scale: 0.6 },
  },
};

const CARD =
  "relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-8 border border-ink/15 bg-canvas p-5 text-center transition-colors duration-300 hover:border-ink/60 focus-visible:border-ink";

/** Um card quadrado: o ícone no efeito do mapa da home e o nome embaixo. */
function ContactCard({ glyph, label, delay, ...props }: { glyph: Glyph; label: string; delay: number } & Omit<React.ComponentProps<"button">, "children" | "className">) {
  return (
    <button type="button" {...props} className={CARD}>
      <ScanGlyph glyph={glyph} delay={delay} className="aspect-square w-3/5 max-w-44" />
      <span className="text-label">{label}</span>
    </button>
  );
}

/**
 * Os canais de contato: dois cards quadrados lado a lado, o do formulário e o do WhatsApp, cada um com o seu ícone no efeito do
 * mapa da home (linhas laranja, relevo, espessura e construção linha a linha). Um clique no primeiro abre o formulário de
 * mensagem. Só o visual por enquanto: o envio e o link do WhatsApp ainda não fazem nada.
 */
export function ContactCards() {
  const still = useLite();
  const [open, setOpen] = useState(false);
  const formId = useId();

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <ContactCard glyph={FORM} label="Enviar mensagem" delay={0} aria-expanded={open} aria-controls={formId} onClick={() => setOpen((value) => !value)} />
        <ContactCard glyph={WHATSAPP} label="WhatsApp" delay={350} />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={formId}
            key="form"
            initial={still ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={still ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: still ? 0 : 0.6, ease: EASE }}
            className="overflow-hidden"
          >
            <form onSubmit={(event) => event.preventDefault()} className="mt-10 grid gap-5 border-t border-ink/15 pt-10 md:grid-cols-2" aria-label="Enviar uma mensagem">
              <Field label="Nome" name="name" autoComplete="name" />
              <Field label="E-mail" name="email" type="email" autoComplete="email" />
              <Field label="Mensagem" name="message" multiline className="md:col-span-2" />
              <div className="md:col-span-2">
                <button type="submit" className="inline-flex h-9 items-center justify-center rounded-sharp bg-ink px-4 text-label whitespace-nowrap text-ink-foreground transition-colors hover:bg-ink/85">
                  Enviar mensagem
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, name, type = "text", multiline, autoComplete, className }: { label: string; name: string; type?: string; multiline?: boolean; autoComplete?: string; className?: string }) {
  const id = useId();
  const control = "w-full rounded-sharp border border-ink/20 bg-canvas px-3 text-base text-ink outline-none transition-colors focus:border-ink";
  return (
    <div className={className}>
      <label htmlFor={id} className="text-label text-ink-soft">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} name={name} rows={5} className={cn(control, "mt-2 py-2")} />
      ) : (
        <input id={id} name={name} type={type} autoComplete={autoComplete} className={cn(control, "mt-2 h-11")} />
      )}
    </div>
  );
}
