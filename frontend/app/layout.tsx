import type { Metadata } from "next";
import { DM_Sans, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APPEARANCE_INIT_SCRIPT, DEFAULT_APPEARANCE } from "@/lib/appearance";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Os atributos de tema são trocados pelo script do <head> antes do primeiro paint: o React não deve reclamar da diferença.
    <html
      lang="pt-BR"
      data-accent={DEFAULT_APPEARANCE.accent}
      data-font={DEFAULT_APPEARANCE.font}
      suppressHydrationWarning
      className={`${inter.variable} ${dmSans.variable} ${sourceSerif.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_INIT_SCRIPT }} />
      </head>
      {/* suppressHydrationWarning: extensões do navegador (ColorZilla, tradutores...) acrescentam atributos ao <body> antes do React carregar. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
