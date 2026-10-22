import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DM_Sans, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { parseAppearance } from "@/lib/appearance";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Fontes alternativas das Configurações: só são baixadas quando escolhidas (sem preload).
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], preload: false });
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "ERP Imobiliária", template: "%s · ERP Imobiliária" },
  description: "Administração de condomínios, locações, vendas e financeiro.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const appearance = parseAppearance((name) => cookieStore.get(name)?.value);

  return (
    <html
      lang="pt-BR"
      data-mode={appearance.mode}
      data-accent={appearance.accent}
      data-font={appearance.font}
      className={`${inter.variable} ${dmSans.variable} ${sourceSerif.variable} h-full`}
    >
      {/* Extensões do navegador (ColorZilla, Grammarly...) acrescentam atributos ao <body> antes da hidratação. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
