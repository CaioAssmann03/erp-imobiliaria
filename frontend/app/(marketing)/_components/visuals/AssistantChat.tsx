"use client";

import { motion, useAnimationControls, useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

import { AssistantMascot } from "@/components/brand/AssistantMascot";
import { lookToward, NEUTRAL, RANGE } from "@/app/(marketing)/_components/visuals/mascot-look";

const EASE = [0.22, 1, 0.36, 1] as const;

const FIRST_QUESTION = "O que é a fração ideal?";
const FIRST_ANSWER =
  "É a parte que cada unidade tem no condomínio, em porcentagem. O plano de cobrança usa essa fração para dividir um total entre as unidades.";
const SECOND_QUESTION = "Quanto a unidade 302 deve?";
const SECOND_ANSWER =
  "Eu explico como o sistema funciona, mas não consulto nem altero o que está cadastrado. Para ver esse valor, use as telas do sistema.";

const TYPING_MS_PER_LETTER = 38;
const THINKING_MS = 900;

/** As linhas horizontais do skyline (3 px cheios a cada 4), no laranja do destaque: o efeito do site. */
const SCANLINES = "repeating-linear-gradient(to bottom, var(--color-brand) 0 3px, transparent 3px 4px)";

/** Escreve `text` letra por letra assim que `run` fica verdadeiro; já inteiro quando `still` (menos movimento). */
function Typewriter({ text, run, still }: { text: string; run: boolean; still: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (still || !run) return;
    const timer = setInterval(() => setCount((current) => Math.min(current + 1, text.length)), TYPING_MS_PER_LETTER);
    return () => clearInterval(timer);
  }, [run, still, text.length]);

  return <>{still ? text : text.slice(0, count)}</>;
}

/** A pergunta da pessoa: um retângulo cheio de tinta, à direita. */
function Question({ children, visible, still }: { children: React.ReactNode; visible: boolean; still: boolean }) {
  return (
    <motion.p
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
      transition={{ duration: still ? 0 : 0.4, ease: EASE }}
      className="ml-auto w-fit max-w-[85%] bg-ink px-4 py-2.5 text-body text-ink-foreground"
    >
      {children}
    </motion.p>
  );
}

/** A resposta: texto com uma tira de linhas laranja ao lado, que se desenha de cima para baixo. */
function Answer({ children, visible, still }: { children: string; visible: boolean; still: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
      transition={{ duration: still ? 0 : 0.6, ease: EASE }}
      className="flex max-w-[92%] gap-3"
    >
      <span className="relative w-1.5 shrink-0">
        <motion.span
          initial={false}
          animate={{ clipPath: visible ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
          transition={{ duration: still ? 0 : 0.9, ease: EASE }}
          className="absolute inset-0"
          style={{ backgroundImage: SCANLINES }}
        />
      </span>
      <p className="text-body leading-relaxed text-ink-soft">{children}</p>
    </motion.div>
  );
}

/** "Pensando": uma faixa de linhas laranja que se enche da esquerda para a direita e some quando a resposta chega. */
function Thinking({ active, still }: { active: boolean; still: boolean }) {
  if (still) return null;
  return (
    <div className={cn("h-3 w-24 transition-opacity duration-300", active ? "opacity-100" : "opacity-0")}>
      <motion.span
        initial={false}
        animate={{ clipPath: active ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
        transition={{ duration: active ? THINKING_MS / 1000 : 0, ease: "linear" }}
        className="block size-full"
        style={{ backgroundImage: SCANLINES }}
      />
    </div>
  );
}

/**
 * Client Component: o Assistente de ajuda como um personagem (o logo da casinha de olhos arregalados, em laranja). Fechado, ele
 * acorda quando chega à tela, flutua, respira e pisca, com as pupilas seguindo o mouse, ao lado de um balão que diz para clicar nele.
 * Ao clicar, ele pula (achatando e esticando) e o balão vira a conversa, que toca uma vez: uma pergunta é escrita letra por letra (ele
 * olha para o balão), uma faixa de linhas laranja "pensa" (as pupilas varrem de um lado a outro, olhando para cima), a resposta
 * aparece (as faixas do corpo pulsam) e depois vem uma pergunta sobre um dado cadastrado, cuja resposta mostra o limite: ele explica o
 * sistema, não consulta nem altera cadastros. Já aberta e inteira, parada, para quem prefere menos movimento.
 * Ilustrativo: o texto não vem do assistente de verdade.
 */
export function AssistantChat({ className }: { className?: string }) {
  const still = useLite();
  const [started, setStarted] = useState(false);
  const open = still || started;
  // 0 parado · 1 escreve a 1ª pergunta · 2 pensa · 3 1ª resposta · 4 escreve a 2ª · 5 pensa · 6 2ª resposta
  const [stage, setStage] = useState(0);
  const finalStage = still ? 6 : stage;
  const [talking, setTalking] = useState(false);

  const mascotRef = useRef<HTMLDivElement>(null);
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const eyeX = useSpring(targetX, { stiffness: 170, damping: 20 });
  const eyeY = useSpring(targetY, { stiffness: 170, damping: 20 });

  // As pupilas: seguem o mouse; para o balão enquanto a pergunta é escrita; varrem de lado a lado, olhando para cima, enquanto pensa.
  // A mola (`useSpring`) deixa tudo fluido.
  useEffect(() => {
    if (still) return;
    if (finalStage === 1 || finalStage === 4) {
      targetX.set(NEUTRAL.x + RANGE.x * 0.97);
      targetY.set(NEUTRAL.y + 0.2);
      return;
    }
    if (finalStage === 2 || finalStage === 5) {
      let right = false;
      const sweep = () => {
        // Dentro do círculo de raio 1 (0,85² + 0,5² < 1), para a pupila não sair do olho.
        targetX.set(NEUTRAL.x + (right ? 0.85 : -0.85) * RANGE.x);
        targetY.set(NEUTRAL.y - 0.5 * RANGE.y);
        right = !right;
      };
      sweep();
      const timer = setInterval(sweep, 380);
      return () => clearInterval(timer);
    }
    targetX.set(NEUTRAL.x);
    targetY.set(NEUTRAL.y);
    const follow = (event: PointerEvent) => {
      const box = mascotRef.current?.getBoundingClientRect();
      if (box) lookToward(event, box, targetX, targetY);
    };
    window.addEventListener("pointermove", follow, { passive: true });
    return () => window.removeEventListener("pointermove", follow);
  }, [finalStage, still, targetX, targetY]);

  useEffect(() => {
    if (still || !started) return;
    const typing = (text: string) => text.length * TYPING_MS_PER_LETTER + 350;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = 800; // depois do pulo e de o balão abrir
    for (const [next, wait] of [
      [1, typing(FIRST_QUESTION)],
      [2, THINKING_MS],
      [3, 2600],
      [4, typing(SECOND_QUESTION)],
      [5, THINKING_MS],
      [6, 0],
    ] as const) {
      timers.push(setTimeout(() => setStage(next), at));
      if (next === 3 || next === 6) {
        timers.push(setTimeout(() => setTalking(true), at));
        timers.push(setTimeout(() => setTalking(false), at + 2200));
      }
      at += wait;
    }
    return () => timers.forEach(clearTimeout);
  }, [started, still]);

  // Os pulos: um achatar, um esticar no ar e a volta, sempre a partir do chão.
  const hop = useAnimationControls();
  const mascotVisible = useInView(mascotRef);
  const jump = (height: number) =>
    hop.start({
      y: [0, 0, -height, 0],
      scaleY: [1, 0.9, 1.08, 1],
      scaleX: [1, 1.07, 0.96, 1],
      transition: { duration: 0.75, times: [0, 0.2, 0.6, 1], ease: EASE },
    });

  // De vez em quando, enquanto espera o clique, ele pula sozinho (às vezes duas vezes seguidas), para chamar a atenção.
  useEffect(() => {
    if (still || started || !mascotVisible) return;
    let timer: ReturnType<typeof setTimeout>;
    let second: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        void jump(22);
        if (Math.random() < 0.35) second = setTimeout(() => void jump(22), 850);
        schedule();
      }, 4000 + Math.random() * 4000);
    };
    schedule();
    return () => {
      clearTimeout(timer);
      clearTimeout(second);
    };
    // `jump` só usa os controles, que são estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still, started, mascotVisible]);

  const start = () => {
    setStarted(true);
    void jump(34);
  };

  return (
    <div className={cn("flex flex-col items-start gap-5 sm:flex-row sm:gap-7", className)}>
      {/* O mesmo elemento antes e depois do clique (senão ele remonta e perde o pulo); depois do clique o botão fica sem ação. */}
      <button
        type="button"
        onClick={start}
        disabled={open}
        aria-hidden={open || undefined}
        aria-label="Começar: ver um exemplo do Assistente"
        className={cn(
          "shrink-0 outline-none",
          !open && "transition-transform duration-300 hover:-rotate-3 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink",
        )}
      >
        <motion.div
          ref={mascotRef}
          animate={hop}
          style={{ transformOrigin: "50% 100%" }}
          className="w-14 sm:w-20"
        >
          <AssistantMascot eyeX={eyeX} eyeY={eyeY} legs={open} talking={talking} className="block h-auto w-full" />
        </motion.div>
      </button>

      {/* O balão: no começo, o convite; depois, a conversa (a ilustração fica fora da leitura de tela). */}
      <div className="relative w-full min-w-0 flex-1 border border-ink/15 p-4 sm:p-5">
        <span
          aria-hidden
          className="absolute top-8 -left-[7px] hidden size-3 rotate-45 border-b border-l border-ink/15 bg-canvas sm:block"
        />
        <motion.div
          initial={false}
          animate={{ height: open ? 0 : "auto", opacity: open ? 0 : 1 }}
          transition={{ duration: still ? 0 : 0.4, ease: EASE }}
          className="overflow-hidden"
        >
          <p className="text-label text-ink">Assistente</p>
          <p className="mt-2 text-body leading-relaxed text-ink-soft">Oi! Clique em mim e eu mostro como ajudo.</p>
        </motion.div>

        <motion.div
          aria-hidden
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: still ? 0 : 0.6, delay: open && !still ? 0.3 : 0, ease: EASE }}
          className="overflow-hidden"
        >
          <div className="space-y-4">
            <Question visible={finalStage >= 1} still={still}>
              <Typewriter text={FIRST_QUESTION} run={finalStage >= 1} still={still} />
            </Question>
            <Thinking active={finalStage === 2} still={still} />
            <Answer visible={finalStage >= 3} still={still}>
              {FIRST_ANSWER}
            </Answer>

            <Question visible={finalStage >= 4} still={still}>
              <Typewriter text={SECOND_QUESTION} run={finalStage >= 4} still={still} />
            </Question>
            <Thinking active={finalStage === 5} still={still} />
            <Answer visible={finalStage >= 6} still={still}>
              {SECOND_ANSWER}
            </Answer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
