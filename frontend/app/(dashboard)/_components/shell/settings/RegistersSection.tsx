import { Dialog } from "@base-ui/react/dialog";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { SettingsSection } from "./SettingsSection";

const REGISTERS = [
  { href: "/billing/events", label: "Eventos", hint: "Códigos que preenchem a descrição dos lançamentos" },
  { href: "/condominiums/cost-centers", label: "Sub-contas", hint: "Conta normal, fundo de reserva, obras..." },
];

/** Atalhos para os cadastros de apoio da cobrança (fecham o diálogo ao abrir a página). */
export function RegistersSection() {
  return (
    <SettingsSection title="Cadastros">
      <ul className="space-y-2">
        {REGISTERS.map((register) => (
          <li key={register.href}>
            <Dialog.Close
              // O botão de fechar é desenhado como um link (Next): sem isto o Base UI espera um <button> de verdade.
              nativeButton={false}
              render={
                <Link
                  href={register.href}
                  className="flex items-center justify-between gap-3 rounded-panel bg-surface-muted p-3 outline-none ring-1 ring-transparent transition-shadow hover:ring-ink-faint focus-visible:ring-2 focus-visible:ring-brand/60"
                />
              }
            >
              <span>
                <span className="block text-body font-medium">{register.label}</span>
                <span className="block text-caption text-ink-soft">{register.hint}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-soft" aria-hidden />
            </Dialog.Close>
          </li>
        ))}
      </ul>
    </SettingsSection>
  );
}
