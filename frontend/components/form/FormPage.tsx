/**
 * O lugar de todo formulário (e das telas próprias de um cadastro): encostado à esquerda, com `max-w-3xl` (`max-w-4xl` de `xl` em diante). A lista à esquerda e o menu à direita ficam nas bordas; numa tela larga a sobra é dividida em dois, uma de cada lado do formulário (`mx-auto`), então o espaço entre as três colunas cresce junto (de `2xl` em diante as colunas laterais também ficam mais largas e o vão maior). Com `aside` (o menu da direita) ele
 * fica ao lado (abaixo de `xl`, é uma fileira de botões presa no alto, antes do conteúdo); sem ele, em telas largas, o mesmo espaço fica reservado, então o conteúdo está no mesmo ponto com ou sem menu. O fundo
 * (`pb-24`) deixa respiro para a barra de ações fixa não cobrir o fim da página.
 */
export function FormPage({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-start xl:gap-8 2xl:gap-12">
      <div className="min-w-0 flex-1 pb-24">
        <div className="max-w-3xl xl:mx-auto xl:max-w-4xl">{children}</div>
      </div>
      {aside ?? <div aria-hidden className="hidden w-48 shrink-0 xl:block 2xl:w-56" />}
    </div>
  );
}
