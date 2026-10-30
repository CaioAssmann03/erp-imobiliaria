import { FEATURES } from "@/app/(marketing)/_components/content";
import { Reveal } from "@/app/(marketing)/_components/motion/Reveal";

/** Recursos em lista plana: linha fina no alto, número em rótulo, nome em serifa e descrição. */
export function FeatureGrid() {
  return (
    <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((feature, index) => (
        <Reveal key={feature.title} delay={(index % 3) * 0.08} className="border-t border-ink/15 pt-5">
          <p className="text-label text-brand tabular-nums">{String(index + 1).padStart(2, "0")}</p>
          <h3 className="mt-3 font-display text-title font-normal">{feature.title}</h3>
          <p className="mt-2 text-body text-ink-soft">{feature.description}</p>
        </Reveal>
      ))}
    </div>
  );
}
