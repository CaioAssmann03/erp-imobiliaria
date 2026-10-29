import { SiteFooter } from "./_components/SiteFooter";
import { SiteHeader } from "./_components/SiteHeader";
import { SmoothScroll } from "./_components/SmoothScroll";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="theme-public relative min-h-screen flex-1 overflow-x-clip bg-canvas">
      <SmoothScroll />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
