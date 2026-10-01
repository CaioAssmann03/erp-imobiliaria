import { FormPage } from "@/components/form/FormPage";
import { PageHeader } from "@/components/PageHeader";
import { PessoaForm } from "@/components/PessoaForm";

export default function NovaPessoaPage() {
  return (
    <FormPage>
      <PageHeader back={{ href: "/pessoas", label: "Pessoas" }} title="Nova pessoa" />
      <PessoaForm />
    </FormPage>
  );
}
