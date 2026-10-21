"use client";

import { useSyncExternalStore } from "react";

import { isApplePlatform } from "@/lib/platform";

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: { platform?: string };
}

/** O aparelho é da Apple? `userAgentData` onde existe, senão `navigator.platform`. */
export function detectApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as NavigatorWithUserAgentData;
  return isApplePlatform(nav.userAgentData?.platform ?? nav.platform ?? "");
}

const subscribe = () => () => undefined;

/**
 * `true` no Mac e no iOS. No servidor é `false` e o navegador corrige logo após hidratar
 * (`useSyncExternalStore` não gera erro de hidratação por causa disso).
 */
export function useIsApplePlatform(): boolean {
  return useSyncExternalStore(subscribe, detectApplePlatform, () => false);
}
