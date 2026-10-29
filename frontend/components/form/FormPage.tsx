/**
 * O lugar de todo formulário (e das telas próprias de um cadastro): encostado à esquerda, sempre na mesma largura. Com `aside` (o menu da direita) ele
 * fica ao lado; sem ele, em telas largas, o mesmo espaço fica reservado, então o conteúdo está no mesmo ponto com ou sem menu. O fundo
 * (`pb-24`) deixa respiro para a barra de ações fixa não cobrir o fim da página.
 */
export function FormPage({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-8">
      <div className="min-w-0 max-w-3xl flex-1 pb-24">{children}</div>
      {aside ?? <div aria-hidden className="hidden w-48 shrink-0 xl:block" />}
    </div>
  );
}
