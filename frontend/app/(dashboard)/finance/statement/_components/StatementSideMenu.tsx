import { SectionIndex } from "@/components/SectionIndex";
import { condominiumUrl } from "@/lib/condominium-registry";
import { STATEMENT_SECTIONS } from "@/lib/statement-workspace";

/** O índice da direita do extrato: o saldo e os lançamentos (o marcador acompanha a rolagem) e, separado, a ida aos dados do condomínio. */
export function StatementSideMenu({ condominiumId }: { condominiumId: string }) {
  return (
    <SectionIndex
      sections={STATEMENT_SECTIONS}
      label="Seções do extrato"
      title="Neste extrato"
      links={{ title: "Condomínio", items: [{ href: condominiumUrl(condominiumId), label: "Dados do condomínio" }] }}
    />
  );
}
