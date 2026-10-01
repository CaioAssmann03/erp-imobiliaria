/** Coluna centralizada para páginas de formulário (cabeçalho + formulário). */
export function FormPage({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-3xl">{children}</div>;
}
