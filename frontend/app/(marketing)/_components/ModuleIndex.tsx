import { Reveal } from "./Reveal";
import { MODULES } from "./modules";

/** Índice numerado dos módulos: número em rótulo, nome em serifa e uma frase. No hover, o número acende. */
export function ModuleIndex() {
  return (
    <ol>
      {MODULES.map((module, index) => (
        <li key={module.title} className="border-t border-ink/10 last:border-b">
          <Reveal
            delay={index * 0.06}
            className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 gap-y-1 py-6 md:grid-cols-[3.5rem_minmax(0,16rem)_1fr] md:gap-x-8"
          >
            <span className="text-label text-ink-faint tabular-nums transition-colors group-hover:text-brand">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-title font-normal">{module.title}</h3>
            <p className="col-start-2 max-w-[52ch] text-body text-ink-soft md:col-start-auto">{module.description}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
