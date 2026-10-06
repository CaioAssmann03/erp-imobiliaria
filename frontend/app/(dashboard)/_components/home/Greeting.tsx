"use client";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

/** Client Component: depende da hora do navegador (o servidor roda em UTC). */
export function Greeting() {
  return <span suppressHydrationWarning>{greeting()}</span>;
}
