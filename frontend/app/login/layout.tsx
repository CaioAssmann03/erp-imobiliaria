import { SiteHeader } from "@/app/(marketing)/_components/layout/SiteHeader";

/**
 * O login é uma página pública: usa o mesmo cabeçalho e o mesmo tema das páginas da home (claro com o laranja), então o
 * destaque e a fonte salvos do ERP não vazam para cá.
 */
export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return (
    <div className="theme-public relative min-h-screen flex-1 overflow-x-clip bg-canvas text-ink">
      <SiteHeader />
      {children}
    </div>
  );
}
