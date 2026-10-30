import { HouseLogo } from "@/components/HouseLogo";
import { MetriLogo } from "@/components/MetriLogo";

/** A marca: o logo METRI (casa e nome) e, no modo `compact` (a rail), só a casa. */
export function Brand({ compact = false }: { compact?: boolean }) {
  return compact ? <HouseLogo className="size-7 shrink-0 text-brand" /> : <MetriLogo className="h-7 w-auto" />;
}
