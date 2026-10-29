import { CostCenterRedirect } from "../../_components/CostCenterRedirect";

/** Endereço antigo de uma sub-conta (resultado da busca global): abre a edição dentro do condomínio dela. */
export default async function CostCenterRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CostCenterRedirect costCenterId={id} />;
}
