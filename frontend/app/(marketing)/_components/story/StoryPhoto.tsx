"use client";

import { motion, useInView, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { PHOTOS } from "@/app/(marketing)/_components/globe/photos";
import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

interface StoryPhotoProps {
  /** Posição em `PHOTOS` (as fotos ilustrativas de condomínios). */
  photo: number;
  /** Em que lado da coluna de texto a foto fica (de `xl` para cima; abaixo disso ela vai inteira, acima do título). */
  side: "left" | "right";
  /** Proporção e largura da foto no canto, para as fotos não terem todas o mesmo tamanho. */
  shape?: "portrait" | "tall" | "square";
  /** Quanto, em px, a foto anda a mais ou a menos que a página enquanto se rola. */
  drift?: number;
  /** Onde a foto corta (`object-position`), para o assunto ficar à vista. */
  focus?: string;
  className?: string;
}

/** No celular a foto é uma faixa na largura da coluna, entre o intertítulo e o texto; de `sm` até `xl` flutua ao lado do parágrafo (o texto a contorna); de `xl` para cima fica na margem, com a largura em `vw`. */
const SHAPES = {
  portrait: "aspect-[16/10] w-full sm:aspect-[4/5] sm:w-[38%] xl:w-[min(17vw,280px)]",
  tall: "aspect-[16/10] w-full sm:aspect-[3/4] sm:w-[38%] xl:w-[min(19vw,320px)]",
  square: "aspect-[16/10] w-full sm:aspect-square sm:w-[32%] xl:w-[min(15vw,240px)]",
} as const;

/**
 * Uma foto ilustrativa de condomínio vista pela persiana de linhas finas, como a dos cartões do mapa e a dos prédios do
 * hero. Entra com uma cortina de cima para baixo quando chega à tela e fica sempre ao lado do texto, nunca por cima dele: nas
 * telas muito largas, na margem, andando um pouco mais devagar (ou mais depressa) que a página, para dar profundidade; nas
 * outras, flutuando junto ao parágrafo, que a contorna. No celular não há lado: ela vem numa faixa de largura cheia, com a mesma cortina e, enquanto se rola, a imagem se desloca devagar dentro do quadro. Decorativa.
 */
export function StoryPhoto({ photo, side, shape = "portrait", drift = 70, focus = "50% 50%", className }: StoryPhotoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const still = useLite();
  const shown = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);
  // Fora da margem a foto não anda; em vez disso a imagem se desloca dentro do quadro (ela é maior que ele, então não aparece vão).
  const inner = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);
  // O deslocamento só vale na margem; ao lado do parágrafo a foto fica onde está, para não passar por cima do texto.
  const [margin, setMargin] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1280px)");
    const update = () => setMargin(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <motion.div
      ref={ref}
      aria-hidden
      style={still || !margin ? undefined : { y }}
      className={cn(
        "pointer-events-none mb-6 block sm:mb-4 xl:absolute xl:mb-0 xl:float-none",
        SHAPES[shape],
        side === "left" ? "sm:float-left sm:mr-6 xl:left-[4vw] xl:mr-0" : "sm:float-right sm:ml-6 xl:right-[4vw] xl:ml-0",
        className,
      )}
    >
      <motion.div
        initial={false}
        animate={{ clipPath: shown || still ? "inset(0% 0 0 0)" : "inset(0 0 100% 0)", opacity: shown || still ? 1 : 0 }}
        transition={{ duration: still ? 0 : 1.2, ease: EASE }}
        className="relative size-full overflow-hidden"
      >
        <motion.div style={still || margin ? undefined : { y: inner }} className={cn("size-full", !margin && "scale-[1.18]")}>
          <Image src={PHOTOS[photo]} alt="" className="size-full object-cover" style={{ objectPosition: focus }} sizes="(min-width: 1280px) 320px, (min-width: 640px) 280px, 100vw" />
        </motion.div>
        <span
          className="absolute inset-0"
          style={{ background: "repeating-linear-gradient(to bottom, transparent 0, transparent 3px, var(--color-canvas) 3px, var(--color-canvas) 4px)" }}
        />
      </motion.div>
    </motion.div>
  );
}
