import { ErrorScreen } from "@/components/errors/ErrorScreen";

/** Endereço que não existe fora do painel (páginas públicas, login). */
export default function NotFound() {
  return <ErrorScreen code={404} full />;
}
