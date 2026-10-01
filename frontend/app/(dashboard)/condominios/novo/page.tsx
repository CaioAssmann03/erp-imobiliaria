import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { CondominioForm } from "@/components/CondominioForm";

export default function NovoCondominioPage() {
  return (
    <FormPage>
      <PageHeader
        back={{ href: "/condominios", label: "Condomínios" }}
        title="Novo condomínio"
      />
      <CondominioForm />
    </FormPage>
  );
}
