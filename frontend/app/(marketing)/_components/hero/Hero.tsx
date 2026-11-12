import { HeroDesktop } from "./HeroDesktop";
import { HeroMobile } from "./HeroMobile";

/**
 * O hero da home, em duas composições: `HeroMobile` abaixo de `md` e `HeroDesktop` de `md` para cima. Cada uma é uma `section`
 * que fica fixa no topo (`sticky`) enquanto o conteúdo seguinte sobe por cima, então as duas ficam como irmãs, direto na
 * página (um invólucro tiraria o efeito de cortina); o CSS esconde a que não é da tela. O texto vem de `hero-copy.ts`.
 */
export function Hero() {
  return (
    <>
      <HeroMobile />
      <HeroDesktop />
    </>
  );
}
