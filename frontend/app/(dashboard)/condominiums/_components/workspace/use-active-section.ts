"use client";

import { useEffect, useState } from "react";

import { activeSectionId } from "@/lib/active-section";

/** A linha de leitura: abaixo dela, no topo da tela, ficam o cabeçalho fixo e o respiro do conteúdo. */
const READING_LINE = 120;

/** O `id` da seção em vista enquanto a página rola (a primeira antes de rolar). */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  const key = ids.join("|");

  useEffect(() => {
    const sectionIds = key.split("|");
    const update = () => {
      const positions = sectionIds.flatMap((id) => {
        const element = document.getElementById(id);
        return element ? [{ id, top: element.getBoundingClientRect().top }] : [];
      });
      const isAtPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      setActive(activeSectionId(positions, READING_LINE, isAtPageEnd));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [key]);

  return active;
}
