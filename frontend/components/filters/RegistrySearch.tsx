import { Search } from "lucide-react";

import { ScopeSearchRow } from "./ScopeSearchCard";

/** A busca das listas laterais (`ScopeSearchCard`): ícone, campo e, se houver, o filtro compacto (`children`). `label` é o nome do campo para quem usa leitor de tela. */
export function RegistrySearch({
  label,
  placeholder,
  value,
  onChange,
  children,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <ScopeSearchRow>
      <Search className="size-4 shrink-0" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
      />
      {children}
    </ScopeSearchRow>
  );
}
