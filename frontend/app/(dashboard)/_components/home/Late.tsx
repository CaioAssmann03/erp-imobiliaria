/** Destaque em vermelho para prazos vencidos. */
export function Late({ children }: { children: React.ReactNode }) {
  return <span className="text-danger">{children}</span>;
}
