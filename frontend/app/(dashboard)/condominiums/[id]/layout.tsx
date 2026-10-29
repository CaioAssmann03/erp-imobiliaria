import { CollapseSidebar } from "../_components/workspace/CollapseSidebar";
import { CondominiumHeader } from "../_components/workspace/CondominiumHeader";
import { CondominiumSectionNav } from "../_components/workspace/CondominiumSectionNav";

/**
 * O condomínio aberto: nome, conteúdo da seção e, à direita (xl+), as seções. Este layout não desmonta ao trocar
 * de seção, então o cabeçalho (com a consulta do condomínio) e a navegação não recarregam.
 */
export default async function CondominiumLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="grid gap-x-10 gap-y-5 xl:grid-cols-[minmax(0,1fr)_auto]">
      <CollapseSidebar />
      <div className="xl:col-start-1">
        <CondominiumHeader condominiumId={id} />
      </div>
      <CondominiumSectionNav
        condominiumId={id}
        className="xl:sticky xl:top-4 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start"
      />
      <div className="min-w-0 xl:col-start-1">{children}</div>
    </div>
  );
}
