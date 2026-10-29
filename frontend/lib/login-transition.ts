const EVENT = "metri:login-transition";

/** Avisa a tela de transição (`components/LoginTransition.tsx`) que o login deu certo: ela cobre a tela até o painel abrir. */
export function startLoginTransition() {
  window.dispatchEvent(new Event(EVENT));
}

/** Escuta o aviso de `startLoginTransition`; devolve a função que para de escutar. */
export function onLoginTransition(listener: () => void) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
