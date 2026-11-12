"use client";

import { createContext, useContext, useState } from "react";

interface DashboardEditValue {
  editing: boolean;
  setEditing: (editing: boolean) => void;
}

const DashboardEditContext = createContext<DashboardEditValue | null>(null);

/** Divide o modo de edição entre o ícone do cabeçalho da página e a grade, que ficam em lugares diferentes da árvore. */
export function DashboardEditProvider({ children }: { children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  return <DashboardEditContext.Provider value={{ editing, setEditing }}>{children}</DashboardEditContext.Provider>;
}

export function useDashboardEdit() {
  const value = useContext(DashboardEditContext);
  if (!value) throw new Error("useDashboardEdit precisa estar dentro de DashboardEditProvider");
  return value;
}
