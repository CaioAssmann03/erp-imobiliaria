/**
 * O lugar de todo formulário (e das telas próprias de um cadastro): encostado à esquerda, com a mesma largura (`max-w-3xl`; de `2xl` em diante cresce até `max-w-6xl`, para a tela larga não sobrar vazia à direita). Com `aside` (o menu da direita) ele
 * fica ao lado (abaixo de `xl`, é uma fileira de botões presa no alto, antes do conteúdo); sem ele, em telas largas, o mesmo espaço fica reservado, então o conteúdo está no mesmo ponto com ou sem menu. O fundo
 * (`pb-24`) deixa respiro para a barra de ações fixa não cobrir o fim da página.
 */
export function FormPage({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-start xl:gap-8">
      <div className="min-w-0 max-w-3xl flex-1 pb-24 2xl:max-w-6xl">{children}</div>
      {aside ?? <div aria-hidden className="hidden w-48 shrink-0 xl:block" />}
    </div>
  );
}
