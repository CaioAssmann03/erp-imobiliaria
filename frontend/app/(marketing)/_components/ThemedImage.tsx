import Image, { type ImageProps, type StaticImageData } from "next/image";

import { cn } from "@/lib/utils";

type ThemedImageProps = Omit<ImageProps, "src"> & {
  /** A tela no modo claro e no escuro. */
  light: StaticImageData;
  dark: StaticImageData;
};

/**
 * Uma tela do sistema nos dois modos: as duas imagens ficam na página, mas só a do modo escolhido aparece (`.print-light` e
 * `.print-dark` em `app/globals.css`, pelo `data-mode` do `<html>`); a escondida não é baixada. Só a clara leva o texto
 * alternativo, para ele não ser lido duas vezes.
 */
export function ThemedImage({ light, dark, alt, className, ...props }: ThemedImageProps) {
  return (
    <>
      <Image {...props} src={light} alt={alt} className={cn(className, "print-light")} />
      <Image {...props} src={dark} alt="" aria-hidden className={cn(className, "print-dark")} />
    </>
  );
}
