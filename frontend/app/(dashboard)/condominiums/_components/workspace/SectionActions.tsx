/** A ação principal de uma seção do condomínio (ex.: "Nova unidade"), à direita, acima da lista. */
export function SectionActions({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex justify-end">{children}</div>;
}
