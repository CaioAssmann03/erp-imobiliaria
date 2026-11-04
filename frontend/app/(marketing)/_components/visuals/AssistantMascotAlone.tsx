"use client";

import { motion, useAnimationControls, useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

import { AssistantMascot } from "@/components/brand/AssistantMascot";
import { lookToward, NEUTRAL, RANGE } from "@/app/(marketing)/_components/visuals/mascot-look";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Um passo dos olhos: daqui a `at` ms, as pupilas vão para (x, y), já contando de NEUTRAL. */
type Step = readonly [at: number, x: number, y: number];

const at = (x: number, y: number) => [NEUTRAL.x + x, NEUTRAL.y + y] as const;

/** Revira os olhos: uma volta e meia pela borda dos olhos, começando para baixo. */
function rollSteps(): Step[] {
  const count = 40;
  return Array.from({ length: count + 1 }, (_, index) => {
    const angle = Math.PI / 2 + (index / count) * Math.PI * 3;
    return [index * 45, RANGE.x * Math.cos(angle), RANGE.y * Math.sin(angle)] as const;
  });
}

/** Olha em volta: esquerda, direita, cima, baixo, e volta ao centro. */
const AROUND_STEPS: Step[] = [
  [0, -RANGE.x, 0],
  [550, RANGE.x, 0],
  [1100, 0, -RANGE.y],
  [1650, 0, RANGE.y],
  [2200, 0, 0],
];

/** Balança os olhos de um lado a outro, como quem diz "não". */
const NO_STEPS: Step[] = Array.from({ length: 7 }, (_, index) => [index * 230, index % 2 === 0 ? -RANGE.x : RANGE.x, 0] as const);

/** Mexe os olhos para cima e para baixo, como quem diz "sim". */
const YES_STEPS: Step[] = Array.from({ length: 7 }, (_, index) => [index * 230, 0, index % 2 === 0 ? -RANGE.y : RANGE.y * 0.6] as const);

/**
 * As reações, em ordem: uma por clique, voltando ao começo depois da última. `text` é o que o balão diz enquanto ela dura e `legs` diz
 * se ele fica com as pernas à mostra (elas descem nas duas primeiras e somem nas duas seguintes, e assim por diante).
 */
const REACTIONS: readonly { text: string; steps: Step[]; hop: boolean; legs: boolean }[] = [
  { text: "Revirando os olhos.", steps: rollSteps(), hop: true, legs: true },
  { text: "Dando uma olhada em volta.", steps: AROUND_STEPS, hop: false, legs: true },
  { text: "Dizendo que não.", steps: NO_STEPS, hop: false, legs: false },
  { text: "Dizendo que sim.", steps: YES_STEPS, hop: true, legs: false },
];

const INVITATION = "Oi! Clique em mim e veja o que acontece.";

/**
 * Client Component: o personagem do Assistente ao lado de um balão que diz para clicar (a página do Assistente). O clique não abre
 * conversa: ele pula, as pernas descem ou somem e os olhos reagem, uma reação por clique (revirar, olhar em volta, "não", "sim"), com o
 * balão dizendo o que está fazendo. Fora das reações os olhos seguem o mouse, e de vez em quando ele pula sozinho. Parado no modo lite.
 */
export function AssistantMascotAlone({ className }: { className?: string }) {
  const still = useLite();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  const hop = useAnimationControls();
  const targetX = useMotionValue(NEUTRAL.x);
  const targetY = useMotionValue(NEUTRAL.y);
  const eyeX = useSpring(targetX, { stiffness: 170, damping: 20 });
  const eyeY = useSpring(targetY, { stiffness: 170, damping: 20 });

  const [legs, setLegs] = useState(false);
  const [text, setText] = useState(INVITATION);
  const [busy, setBusy] = useState(false);
  const nextReaction = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const jump = (height: number) =>
    hop.start({
      y: [0, 0, -height, 0],
      scaleY: [1, 0.9, 1.08, 1],
      scaleX: [1, 1.07, 0.96, 1],
      transition: { duration: 0.75, times: [0, 0.2, 0.6, 1], ease: EASE },
    });

  // Os olhos seguem o mouse, menos durante uma reação.
  useEffect(() => {
    if (still || busy) return;
    const follow = (event: PointerEvent) => {
      const box = ref.current?.getBoundingClientRect();
      if (box) lookToward(event, box, targetX, targetY);
    };
    window.addEventListener("pointermove", follow, { passive: true });
    return () => window.removeEventListener("pointermove", follow);
  }, [still, busy, targetX, targetY]);

  // De vez em quando, pula sozinho (às vezes duas vezes seguidas), sem atrapalhar uma reação.
  useEffect(() => {
    if (still || !visible || busy) return;
    let timer: ReturnType<typeof setTimeout>;
    let second: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        void jump(22);
        if (Math.random() < 0.35) second = setTimeout(() => void jump(22), 850);
        schedule();
      }, 3500 + Math.random() * 3500);
    };
    schedule();
    return () => {
      clearTimeout(timer);
      clearTimeout(second);
    };
    // `jump` só usa os controles, que são estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still, visible, busy]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const react = () => {
    if (busy) return;
    const reaction = REACTIONS[nextReaction.current % REACTIONS.length];
    nextReaction.current += 1;
    setLegs(reaction.legs);
    setText(reaction.text);
    setBusy(true);
    void jump(reaction.hop ? 34 : 18);
    const last = reaction.steps[reaction.steps.length - 1][0];
    reaction.steps.forEach(([delay, x, y]) => {
      const [targetXValue, targetYValue] = at(x, y);
      timers.current.push(
        setTimeout(() => {
          targetX.set(targetXValue);
          targetY.set(targetYValue);
        }, 350 + delay),
      );
    });
    timers.current.push(
      setTimeout(() => {
        targetX.set(NEUTRAL.x);
        targetY.set(NEUTRAL.y);
        setText(INVITATION);
        setBusy(false);
      }, 350 + last + 700),
    );
  };

  return (
    <div className={cn("flex flex-col items-start gap-5 sm:flex-row sm:gap-7", className)}>
      <button
        type="button"
        onClick={react}
        disabled={busy && !still}
        aria-label="Clique para o Assistente mexer os olhos"
        className="shrink-0 outline-none transition-transform duration-300 hover:-rotate-3 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        <motion.div ref={ref} animate={hop} style={{ transformOrigin: "50% 100%" }} className="w-14 sm:w-20">
          <AssistantMascot eyeX={eyeX} eyeY={eyeY} legs={legs || still} talking={false} className="block h-auto w-full" />
        </motion.div>
      </button>

      <div className="relative w-full min-w-0 flex-1 border border-ink/15 p-4 sm:p-5">
        <span aria-hidden className="absolute top-8 -left-[7px] hidden size-3 rotate-45 border-b border-l border-ink/15 bg-canvas sm:block" />
        <p className="text-label text-ink">Assistente</p>
        <p aria-live="polite" className="mt-2 text-body leading-relaxed text-ink-soft">
          {still ? "Oi! Eu sou o Assistente." : text}
        </p>
      </div>
    </div>
  );
}
