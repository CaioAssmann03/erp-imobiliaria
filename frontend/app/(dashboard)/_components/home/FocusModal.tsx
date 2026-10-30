"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "next/navigation";

import { modalBackdropClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Client Component: mostra um elemento do painel em destaque. Fecha com a seta
 * de voltar, com Esc ou clicando fora; sempre volta ao painel.
 */
export function FocusModal({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const close = () => router.replace("/dashboard", { scroll: false });

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        {/* Só a visão ampliada do painel escurece um pouco mais que os outros modais (45% em vez de 30%). */}
        <Dialog.Backdrop className={cn("z-40", modalBackdropClass, "bg-black/45")} />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[min(64rem,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-card bg-surface p-6 shadow-float outline-none transition duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <button
            type="button"
            onClick={close}
            className="mb-3 text-body text-ink-soft transition-colors hover:text-ink"
          >
            ‹ Painel
          </button>
          <Dialog.Title className="text-title">{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="mt-1 text-body text-ink-soft">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-6">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
