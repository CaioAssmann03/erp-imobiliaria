export const SITE_NAME = "METRI";

/** Endereço público do site (canonical, sitemap, Open Graph). Entra no build: defina `NEXT_PUBLIC_SITE_URL` em produção. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");

export const SITE_DESCRIPTION =
  "Sistema de gestão para administradoras de condomínios: cadastro, cobrança, conciliação bancária e financeiro em um só lugar.";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

const DEMO_MESSAGE = "Olá! Quero agendar uma demonstração do METRI.";

/** Link `mailto:` com o assunto já preenchido; `null` sem e-mail configurado. */
export function mailtoHref(email: string | null | undefined): string | null {
  const address = email?.trim();
  if (!address) return null;
  return `mailto:${address}?subject=${encodeURIComponent("Demonstração do METRI")}&body=${encodeURIComponent(DEMO_MESSAGE)}`;
}

/** Link do WhatsApp com a mensagem pronta; só os dígitos do número contam. `null` sem número válido (DDI + DDD + número). */
export function whatsappHref(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 15) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(DEMO_MESSAGE)}`;
}

/** Canais de contato vindos do ambiente (também no build): um canal sem valor simplesmente não aparece. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null;
export const CONTACT_WHATSAPP = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.trim() || null;
