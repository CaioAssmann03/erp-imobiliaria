/**
 * As áreas do print do painel (`public/marketing/painel.png`, 1440×900 a 2x) que o destaque percorre, em %
 * da imagem. Se o print for refeito, conferir os retângulos.
 */

export interface TourStep {
  label: string;
  line: string;
  /** Retângulo da área no print, em % (left, top, width, height). */
  area: { left: number; top: number; width: number; height: number } | null;
}

export const TOUR_STEPS: TourStep[] = [
  { label: "Painel", line: "O que pede atenção, na primeira tela.", area: null },
  {
    label: "Pendências",
    line: "A carteira conferida sozinha: rateio, responsáveis, reajustes.",
    area: { left: 70.8, top: 30.4, width: 26.8, height: 47.8 },
  },
  {
    label: "Contas a pagar",
    line: "Atrasadas, de hoje, da semana e do mês, de todos os condomínios.",
    area: { left: 15.6, top: 30.4, width: 54.4, height: 47.8 },
  },
  {
    label: "Busca ⌘K",
    line: "Qualquer condomínio, unidade ou pessoa em um atalho.",
    area: { left: 36.4, top: 3.6, width: 40.6, height: 5.6 },
  },
];
