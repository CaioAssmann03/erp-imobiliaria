import { FormPage } from "@/components/form/FormPage";
import { cn } from "@/lib/utils";

/**
 * A moldura das 3 colunas dos cadastros (a lista à esquerda, o conteúdo no meio e o menu à direita), a mesma em todo módulo. Cada módulo só diz
 * qual é a sua lista (`list` recebe a classe que a mostra ou a esconde no celular), qual é o menu da direita (`aside`; sem ele o conteúdo ocupa a
 * largura toda, como na tela vazia) e, no celular, qual das duas telas aparece (`showListOnPhone`/`showPageOnPhone`, de `…FrameState`).
 * A lista e o menu são do layout, por isso continuam montados ao trocar de registro.
 */
export function RegistryFrame({
  list,
  aside,
  showListOnPhone = true,
  showPageOnPhone = true,
  children,
}: {
  list: (className: string) => React.ReactNode;
  aside?: React.ReactNode;
  showListOnPhone?: boolean;
  showPageOnPhone?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="lg:flex lg:items-start lg:gap-8 2xl:gap-12">
      {list(showListOnPhone ? "flex" : "hidden lg:flex")}
      <div className={cn("min-w-0 flex-1", !showPageOnPhone && "hidden lg:block")}>
        {aside ? <FormPage aside={aside}>{children}</FormPage> : children}
      </div>
    </div>
  );
}
