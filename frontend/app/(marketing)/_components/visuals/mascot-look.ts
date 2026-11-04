/** O que se precisa de um valor de movimento aqui: só poder mudá-lo (este arquivo não anima nada). */
interface Settable {
  set: (value: number) => void;
}

// O olhar, de -1 a 1 em cada eixo (ver `AssistantMascot`): NEUTRAL é olhar de frente; o mouse o leva até RANGE para cada lado, e o
// par (x, y) nunca passa de um círculo de raio 1, para a pupila não sair do olho.
export const NEUTRAL = { x: 0, y: 0 };
export const RANGE = { x: 1, y: 1 };
/** A que distância do personagem (em px) o mouse já leva as pupilas até a borda dos olhos. */
const FULL_LOOK_DISTANCE = 260;

/**
 * Leva as pupilas (`targetX`/`targetY`) na direção do mouse. Os olhos ficam no alto do corpo: a referência é a altura deles, não o
 * meio do desenho (`box` é o retângulo do personagem na tela).
 */
export function lookToward(event: PointerEvent, box: DOMRect, targetX: Settable, targetY: Settable) {
  const dx = event.clientX - (box.left + box.width * 0.6);
  const dy = event.clientY - (box.top + box.height * 0.45);
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return;
  const strength = Math.min(distance / FULL_LOOK_DISTANCE, 1);
  targetX.set(NEUTRAL.x + (dx / distance) * strength * RANGE.x);
  targetY.set(NEUTRAL.y + (dy / distance) * strength * RANGE.y);
}
