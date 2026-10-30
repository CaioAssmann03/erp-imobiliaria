import { ErrorScreen } from "@/components/ErrorScreen";

/** Endereço que não existe fora do painel (páginas públicas, login). */
export default function NotFound() {
  return <ErrorScreen code={404} full />;
}
