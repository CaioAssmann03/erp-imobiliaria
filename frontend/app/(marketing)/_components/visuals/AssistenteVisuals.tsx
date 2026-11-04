"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { useLite } from "@/lib/theme/use-lite";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** As linhas finas do site: 3 px de cor, 1 de vão. */
const lines = (color: string) => `repeating-linear-gradient(to bottom, ${color} 0, ${color} 3px, transparent 3px, transparent 4px)`;
const ORANGE_LINES = lines("var(--color-brand)");

/** Cada desenho entra uma vez, subindo e aparecendo, quando chega à tela; `still` (modo lite) o mostra já montado e parado. */
function useDecoration() {
  const ref = useRef<HTMLDivElement>(null);
  const still = useLite();
  const shown = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  return { ref, still, on: shown || still };
}

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, still, on } = useDecoration();
  return (
    <motion.div
      ref={ref}
      aria-hidden
      initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 24 }}
      transition={{ duration: still ? 0 : 0.9, ease: EASE }}
      className={cn("my-12 md:my-14", className)}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const LAYERS = [3, 5, 5, 3] as const;
const NET_WIDTH = 640;
const NET_HEIGHT = 220;
const LAYER_X = [50, 225, 400, 575] as const;
const nodeY = (layer: number, index: number) => 20 + ((index + 0.5) * (NET_HEIGHT - 40)) / LAYERS[layer];

/** Os fios entre uma camada e a seguinte: cada nó se liga a todos da próxima. `lit` são os que carregam sinal. */
const EDGES = LAYERS.slice(0, -1).flatMap((count, layer) =>
  Array.from({ length: count }, (_, from) =>
    Array.from({ length: LAYERS[layer + 1] }, (_, to) => {
      const x1 = LAYER_X[layer];
      const y1 = nodeY(layer, from);
      const x2 = LAYER_X[layer + 1];
      const y2 = nodeY(layer + 1, to);
      return { layer, x1, y1, x2, y2, length: Math.hypot(x2 - x1, y2 - y1), lit: (from + to) % 2 === 0, jitter: ((from * 5 + to * 3) % 7) * 0.06 };
    }),
  ).flat(),
);

const NET_CYCLE = 5; // segundos de um ciclo completo do sinal, da entrada à saída

/**
 * Uma rede de camadas: nós ligados por fios finos e, de tempos em tempos, um sinal laranja que anda de camada em camada (a
 * pergunta entrando, a resposta saindo). Os nós por onde ele passa acendem em linhas laranja.
 */
export function NeuralNet() {
  const { still } = useDecoration();
  return (
    <Frame>
      <svg viewBox={`0 0 ${NET_WIDTH} ${NET_HEIGHT}`} className="mx-auto block h-auto w-full max-w-xl overflow-visible">
        <defs>
          <pattern id="net-lines" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="3" fill="var(--color-brand)" />
          </pattern>
        </defs>
        {EDGES.map((edge, index) => (
          <g key={index}>
            <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke="var(--color-ink)" strokeOpacity="0.16" strokeWidth="1" />
            {edge.lit && !still && (
              <motion.line
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="var(--color-brand)"
                strokeWidth="2"
                strokeDasharray={`26 ${edge.length * 2}`}
                initial={{ strokeDashoffset: 26 }}
                animate={{ strokeDashoffset: -edge.length }}
                transition={{ duration: 1.1, delay: edge.layer * 1.1 + edge.jitter, repeat: Infinity, repeatDelay: NET_CYCLE - 1.1, ease: "linear" }}
              />
            )}
          </g>
        ))}
        {LAYERS.map((count, layer) =>
          Array.from({ length: count }, (_, index) => {
            const x = LAYER_X[layer];
            const y = nodeY(layer, index);
            const edge = layer === 0 || layer === LAYERS.length - 1;
            return (
              <g key={`${layer}-${index}`}>
                <rect x={x - 7} y={y - 7} width="14" height="14" fill="var(--color-canvas)" stroke="var(--color-ink)" strokeWidth="1.5" />
                {edge && <rect x={x - 3} y={y - 3} width="6" height="6" fill="var(--color-ink)" />}
                {!still && (
                  <motion.rect
                    x={x - 7}
                    y={y - 7}
                    width="14"
                    height="14"
                    fill="url(#net-lines)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.9, delay: layer * 1.1 + 0.9 + (index % 3) * 0.05, repeat: Infinity, repeatDelay: NET_CYCLE - 0.9 }}
                  />
                )}
              </g>
            );
          }),
        )}
      </svg>
    </Frame>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

/* ---------------------------------------------------------------------------------------------------------------- */

// O filtro do chat em ação. A primeira pergunta traz um CPF (fictício) e é recusada com a mensagem de verdade do sistema; a segunda,
// sem dado pessoal, passa. O que o filtro acha é só o que o sistema recusa de fato: e-mail ou um número longo.
const REFUSED_QUESTION = "Quanto deve o CPF 000.000.000-00?";
const SENSITIVE_PART = "000.000.000-00";
const CLEAN_QUESTION = "Como funciona a multa por atraso?";
const REFUSAL_MESSAGE = "A pergunta tem dados pessoais (e-mail ou um número longo, como CPF, telefone ou boleto). Tire-os e pergunte de novo.";

type Phase = "idle" | "typingRefused" | "scanRefused" | "refused" | "deleting" | "typingClean" | "scanClean" | "sent";

const TYPING_MS = 48;
const DELETING_MS = 20;
const SCAN_MS = 1100;

const TOKEN_START = REFUSED_QUESTION.indexOf(SENSITIVE_PART);

/** O texto digitado até agora, quebrado em antes / dado pessoal / depois, para o dado poder ser marcado (só na pergunta recusada). */
function splitSensitive(text: string) {
  if (!REFUSED_QUESTION.startsWith(text)) return { before: text, token: "", after: "" };
  const tokenEnd = TOKEN_START + SENSITIVE_PART.length;
  return { before: text.slice(0, TOKEN_START), token: text.slice(TOKEN_START, tokenEnd), after: text.slice(tokenEnd) };
}

/**
 * O filtro de dados pessoais do chat, em desenho: um campo de pergunta onde se digita uma pergunta com um CPF; uma varredura de linhas
 * laranja passa pelo campo e marca o dado; o envio fica travado e aparece a recusa, com o texto que o sistema mostra de verdade. O
 * dado é apagado, uma pergunta limpa é digitada, a varredura passa sem achar nada e o envio é liberado. Depois tudo recomeça.
 */
export function QuestionFilter() {
  const { ref, still, on } = useDecoration();
  const [phase, setPhase] = useState<Phase>("idle");
  const [text, setText] = useState("");
  const [flagged, setFlagged] = useState(false);

  // Cada fase agenda o que acontece nela e a que vem depois; só os temporizadores mudam o estado, nunca o corpo do efeito.
  useEffect(() => {
    if (still || !on) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];
    const after = (ms: number, next: () => void) => {
      timers.push(setTimeout(next, ms));
    };
    /** Digita `full` letra por letra e, ao terminar, passa para `next`. */
    const typeInto = (full: string, next: Phase) => {
      let typed = 0;
      const interval = setInterval(() => {
        typed += 1;
        setText(full.slice(0, typed));
        if (typed >= full.length) {
          clearInterval(interval);
          after(350, () => setPhase(next));
        }
      }, TYPING_MS);
      intervals.push(interval);
    };

    switch (phase) {
      case "idle":
        after(900, () => setPhase("typingRefused"));
        break;
      case "typingRefused":
        typeInto(REFUSED_QUESTION, "scanRefused");
        break;
      case "scanRefused":
        after(SCAN_MS * 0.75, () => setFlagged(true));
        after(SCAN_MS + 200, () => setPhase("refused"));
        break;
      case "refused":
        after(3200, () => setPhase("deleting"));
        break;
      case "deleting": {
        let remaining = REFUSED_QUESTION.length;
        const interval = setInterval(() => {
          remaining -= 1;
          setText(REFUSED_QUESTION.slice(0, Math.max(remaining, 0)));
          if (remaining <= 0) {
            clearInterval(interval);
            setFlagged(false);
            after(300, () => setPhase("typingClean"));
          }
        }, DELETING_MS);
        intervals.push(interval);
        break;
      }
      case "typingClean":
        typeInto(CLEAN_QUESTION, "scanClean");
        break;
      case "scanClean":
        after(SCAN_MS + 200, () => setPhase("sent"));
        break;
      case "sent":
        after(2800, () => {
          setText("");
          setPhase("idle");
        });
        break;
    }
    return () => {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, [phase, still, on]);

  const shownText = still ? REFUSED_QUESTION : text;
  const { before, token, after } = splitSensitive(shownText);
  const isFlagged = still || flagged;
  const refused = still || phase === "refused";
  const sent = !still && phase === "sent";
  const scanning = !still && (phase === "scanRefused" || phase === "scanClean");

  return (
    <Frame>
      <div ref={ref} className="mx-auto w-full max-w-md">
        <motion.div
          animate={refused && !still ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative flex h-12 items-center gap-3 overflow-hidden border border-ink/25 pl-4"
        >
          <span className="min-w-0 flex-1 truncate text-body whitespace-pre text-ink">
            {before}
            {token && (
              <span
                className="relative"
                style={isFlagged ? { backgroundImage: ORANGE_LINES, color: "var(--color-ink)", boxShadow: "0 2px 0 var(--color-brand)" } : undefined}
              >
                {token}
              </span>
            )}
            {after}
            {!still && !sent && phase !== "idle" && <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-ink" />}
          </span>
          <span
            className={cn(
              "mr-1.5 flex h-8 items-center px-4 text-label transition-colors duration-300",
              refused ? "bg-ink/10 text-ink-faint line-through" : sent ? "bg-ink text-ink-foreground" : "bg-ink/10 text-ink-faint",
            )}
          >
            Enviar
          </span>
          {/* A varredura: uma barra de linhas laranja que cruza o campo. */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-2"
            style={{ backgroundImage: ORANGE_LINES }}
            initial={{ left: "0%", opacity: 0 }}
            animate={scanning ? { left: ["0%", "100%"], opacity: [0, 1, 1, 0] } : { left: "0%", opacity: 0 }}
            transition={{ duration: scanning ? SCAN_MS / 1000 : 0, ease: "easeInOut" }}
          />
        </motion.div>

        {/* A recusa, com o texto do sistema; ou, no fim, a linha que fecha em laranja dizendo que a pergunta passou. */}
        <div className="relative mt-3 min-h-[3.25rem]">
          <motion.p
            initial={false}
            animate={{ opacity: refused ? 1 : 0, y: refused ? 0 : -6 }}
            transition={{ duration: still ? 0 : 0.4, ease: EASE }}
            className="flex gap-3 text-sm leading-relaxed text-brand-strong"
          >
            <span aria-hidden className="mt-1 w-1.5 shrink-0 self-stretch" style={{ backgroundImage: ORANGE_LINES }} />
            {REFUSAL_MESSAGE}
          </motion.p>
          <motion.span
            aria-hidden
            className="absolute top-0 left-0 block h-[3px] w-full origin-left"
            style={{ backgroundImage: ORANGE_LINES }}
            initial={false}
            animate={{ scaleX: sent ? 1 : 0, opacity: sent ? 1 : 0 }}
            transition={{ duration: still ? 0 : 0.7, ease: EASE }}
          />
        </div>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------------------------------------------------------- */

const WAVE_BARS = 32;
/** A altura de repouso de cada barra: uma onda suave, mais alta no meio. */
const waveBase = (index: number) => 0.18 + 0.5 * Math.abs(Math.sin((index / WAVE_BARS) * Math.PI * 2.4)) * Math.sin((index / (WAVE_BARS - 1)) * Math.PI);

/**
 * A "voz" do assistente pensando: barras verticais nas linhas laranja que sobem e descem em onda, cada uma um pouco depois da
 * vizinha, como o sinal de uma resposta sendo formada.
 */
export function VoiceWave() {
  const { still } = useDecoration();
  return (
    <Frame>
      <div className="mx-auto flex h-24 w-full max-w-md items-center justify-between gap-[3px]">
        {Array.from({ length: WAVE_BARS }, (_, index) => {
          const base = waveBase(index);
          return (
            <motion.span
              key={index}
              className="block h-full flex-1 origin-center"
              style={{ backgroundImage: ORANGE_LINES }}
              initial={false}
              animate={still ? { scaleY: base } : { scaleY: [base, Math.min(1, base + 0.45), Math.max(0.08, base - 0.1), base] }}
              transition={still ? { duration: 0 } : { duration: 2.2 + (index % 5) * 0.18, delay: index * 0.07, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}
      </div>
    </Frame>
  );
}
